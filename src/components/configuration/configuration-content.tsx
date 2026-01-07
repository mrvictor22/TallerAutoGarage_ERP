'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { configApi, usersApi, expenseCategoriesApi } from '@/services/supabase-api';
import { whatsappApiEnhanced, TwilioStatus } from '@/services/whatsapp-api-enhanced';
import { WorkshopConfig, Profile, ExpenseCategory } from '@/types/database';
import { useAuthStore } from '@/stores/auth';
import { useWorkshopConfig } from '@/contexts/workshop-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/tables/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Users,
  Building,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  Tag,
  AlertCircle,
  Loader2,
  Palette,
  Wrench,
  Zap,
  UserCheck,
  UserX,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

interface UserFormData {
  full_name: string;
  email: string;
  password?: string;
  role: 'admin' | 'reception' | 'mechanic_lead' | 'technician';
  phone?: string;
  is_active: boolean;
  sendInvite: boolean;
}

interface CategoryFormData {
  name: string;
  description?: string;
  color?: string;
}

export function ConfigurationContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin, isSuperAdmin, user } = useAuthStore();
  const { refetch: refetchWorkshopConfig } = useWorkshopConfig();
  const [activeTab, setActiveTab] = useState('mi-cuenta');

  // User management state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    full_name: '',
    email: '',
    password: '',
    role: 'technician',
    phone: '',
    is_active: true,
    sendInvite: true
  });

  // Category management state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3b82f6'
  });
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Workshop config form state
  const [configFormData, setConfigFormData] = useState<Partial<WorkshopConfig>>({});
  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Check admin permissions
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('No tienes permisos para acceder a esta sección');
      router.push('/es/dashboard');
    }
  }, [isAdmin, router]);

  // Fetch workshop config
  const { data: configResponse, isLoading: configLoading } = useQuery({
    queryKey: ['workshop-config'],
    queryFn: () => configApi.getWorkshopConfig(),
    enabled: isAdmin()
  });

  const config = configResponse?.data;

  // Check if config exists (has been saved before)
  const configExists = !!(config?.id);

  // Initialize form data when config loads
  useEffect(() => {
    if (config) {
      setConfigFormData(config);
    }
  }, [config]);

  // Fetch users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(true),
    enabled: isAdmin()
  });

  const users = usersResponse?.data || [];

  // Fetch expense categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseCategoriesApi.getCategories(),
    enabled: isAdmin()
  });

  const categories = categoriesResponse?.data || [];

  // Fetch Twilio status
  const { data: twilioStatusResponse, isLoading: twilioStatusLoading, refetch: refetchTwilioStatus } = useQuery({
    queryKey: ['twilio-status'],
    queryFn: () => whatsappApiEnhanced.getTwilioStatus(),
    enabled: isAdmin()
  });

  const twilioStatus: TwilioStatus | null = twilioStatusResponse?.data || null;

  // Fetch pending approvals (only for super admin)
  const { data: pendingApprovalsResponse, isLoading: pendingApprovalsLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => usersApi.getPendingApprovals(),
    enabled: isSuperAdmin()
  });

  const pendingApprovals = pendingApprovalsResponse?.data || [];

  // Update workshop config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<WorkshopConfig>) => configApi.updateWorkshopConfig(data),
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message || 'Configuración guardada exitosamente');
        // Update form with saved data immediately
        if (response.data) {
          setConfigFormData(response.data);
        }
        // Exit edit mode
        setIsEditingConfig(false);
        // Force immediate refetch of React Query cache
        await queryClient.refetchQueries({ queryKey: ['workshop-config'] });
        // Refresh global workshop config context for sidebar/header
        await refetchWorkshopConfig();
      } else {
        toast.error(response.error || 'Error al guardar configuración');
      }
    },
    onError: () => {
      toast.error('Error al guardar configuración');
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.createUser({
      email: data.email,
      password: data.sendInvite ? undefined : data.password,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone || null,
      sendInvite: data.sendInvite
    }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Usuario creado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setIsUserDialogOpen(false);
        resetUserForm();
      } else {
        toast.error(response.error || 'Error al crear usuario');
      }
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) =>
      usersApi.updateProfile(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Usuario actualizado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setIsUserDialogOpen(false);
        resetUserForm();
      } else {
        toast.error(response.error || 'Error al actualizar usuario');
      }
    }
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.toggleUserStatus(id, isActive),
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message);
        await queryClient.refetchQueries({ queryKey: ['users'] });
      } else {
        toast.error(response.error || 'Error al cambiar estado del usuario');
      }
    }
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: ({ userId, email }: { userId: string; email: string }) =>
      usersApi.resendInvite(userId, email),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Email reenviado exitosamente');
      } else {
        toast.error(response.error || 'Error al reenviar email');
      }
    }
  });

  // Confirm email mutation
  const confirmEmailMutation = useMutation({
    mutationFn: (userId: string) => usersApi.confirmEmail(userId),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Email confirmado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        toast.error(response.error || 'Error al confirmar email');
      }
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => expenseCategoriesApi.createCategory({
      name: data.name,
      description: data.description || null,
      color: data.color || null,
      is_active: true
    }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Categoría creada exitosamente');
        queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
      } else {
        toast.error(response.error || 'Error al crear categoría');
      }
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      expenseCategoriesApi.updateCategory(id, {
        name: data.name,
        description: data.description || null,
        color: data.color || null
      }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Categoría actualizada exitosamente');
        queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
      } else {
        toast.error(response.error || 'Error al actualizar categoría');
      }
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => expenseCategoriesApi.deleteCategory(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || 'Categoría eliminada exitosamente');
        queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
        setCategoryToDelete(null);
      } else {
        toast.error(response.error || 'Error al eliminar categoría');
      }
    }
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: (userId: string) => usersApi.approveUser(userId, user?.id || ''),
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message || 'Usuario aprobado exitosamente');
        await queryClient.refetchQueries({ queryKey: ['pending-approvals'] });
        await queryClient.refetchQueries({ queryKey: ['users'] });
      } else {
        toast.error(response.error || 'Error al aprobar usuario');
      }
    }
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: (userId: string) => usersApi.rejectUser(userId),
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message || 'Solicitud rechazada');
        await queryClient.refetchQueries({ queryKey: ['pending-approvals'] });
      } else {
        toast.error(response.error || 'Error al rechazar solicitud');
      }
    }
  });

  // Delete user mutation (super admin only)
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message || 'Usuario eliminado');
        setUserToDelete(null);
        // Force immediate refetch
        await queryClient.refetchQueries({ queryKey: ['users'] });
        await queryClient.refetchQueries({ queryKey: ['pending-approvals'] });
      } else {
        toast.error(response.error || 'Error al eliminar usuario');
      }
    }
  });

  // Update user role mutation (super admin only)
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'reception' | 'mechanic_lead' | 'technician' }) =>
      usersApi.updateUserRole(userId, role),
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message || 'Rol actualizado');
        // Force immediate refetch
        await queryClient.refetchQueries({ queryKey: ['users'] });
      } else {
        toast.error(response.error || 'Error al actualizar rol');
      }
    }
  });

  // State for user deletion confirmation
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // User table columns
  const userColumns: ColumnDef<Profile>[] = [
    {
      accessorKey: 'full_name',
      header: 'Usuario',
      cell: ({ row }) => {
        const user = row.original;
        const initials = user.full_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{initials}</span>
            </div>
            <div>
              <div className="font-medium">{user.full_name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge
            variant={
              role === 'admin' ? 'default' :
              role === 'reception' ? 'secondary' :
              role === 'mechanic_lead' ? 'default' : 'outline'
            }
            className={role === 'mechanic_lead' ? 'bg-blue-600' : ''}
          >
            {role === 'admin' && 'Administrador'}
            {role === 'reception' && 'Recepción'}
            {role === 'mechanic_lead' && 'Jefe de Mecánicos'}
            {role === 'technician' && 'Técnico'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string | null;
        return phone ? (
          <span className="text-sm">{phone}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => {
                toggleUserStatusMutation.mutate({ id: user.id, isActive: checked });
              }}
            />
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const tableUser = row.original;
        const isSelf = tableUser.id === user?.id;
        const canManage = isSuperAdmin() && !isSelf;

        return (
          <div className="flex items-center gap-2">
            {/* Role selector - only super admin can change roles */}
            {isSuperAdmin() && !isSelf && (
              <Select
                value={tableUser.role}
                onValueChange={(value) => {
                  updateUserRoleMutation.mutate({
                    userId: tableUser.id,
                    role: value as 'admin' | 'reception' | 'mechanic_lead' | 'technician'
                  });
                }}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="reception">Recepción</SelectItem>
                  <SelectItem value="mechanic_lead">Jefe Mecánicos</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Resend invite button */}
            {canManage && !isSelf && (
              <Button
                variant="ghost"
                size="sm"
                title="Reenviar email de invitación"
                onClick={() => resendInviteMutation.mutate({ userId: tableUser.id, email: tableUser.email })}
                disabled={resendInviteMutation.isPending}
              >
                <Mail className="h-4 w-4" />
              </Button>
            )}

            {/* Confirm email button */}
            {canManage && !isSelf && (
              <Button
                variant="ghost"
                size="sm"
                title="Confirmar email manualmente"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => confirmEmailMutation.mutate(tableUser.id)}
                disabled={confirmEmailMutation.isPending}
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            )}

            {/* Edit button */}
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditUser(tableUser)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {/* Delete button - only super admin, can't delete self */}
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setUserToDelete(tableUser)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/* Show badge if it's the current user */}
            {isSelf && (
              <Badge variant="outline" className="text-xs">Tú</Badge>
            )}
          </div>
        );
      },
    },
  ];

  // Category table columns
  const categoryColumns: ColumnDef<ExpenseCategory>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center gap-2">
            {category.color && (
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: category.color }}
              />
            )}
            <span className="font-medium">{category.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null;
        return description ? (
          <span className="text-sm text-muted-foreground">{description}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditCategory(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryToDelete(category.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  const resetUserForm = () => {
    setUserFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'technician',
      phone: '',
      is_active: true,
      sendInvite: true
    });
    setSelectedUser(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    setSelectedCategory(null);
  };

  const handleNewUser = () => {
    resetUserForm();
    setIsEditingUser(true);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setUserFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      is_active: user.is_active,
      password: undefined,
      sendInvite: false
    });
    setIsEditingUser(true);
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!userFormData.full_name || !userFormData.email) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (selectedUser) {
      // Update existing user
      updateUserMutation.mutate({
        id: selectedUser.id,
        data: {
          full_name: userFormData.full_name,
          email: userFormData.email,
          role: userFormData.role,
          phone: userFormData.phone || null,
          is_active: userFormData.is_active
        }
      });
    } else {
      // Create new user
      // Only require password if NOT sending invite
      if (!userFormData.sendInvite && (!userFormData.password || userFormData.password.length < 6)) {
        toast.error('La contrasena debe tener al menos 6 caracteres');
        return;
      }
      createUserMutation.mutate(userFormData);
    }
  };

  const handleNewCategory = () => {
    resetCategoryForm();
    setIsEditingCategory(true);
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6'
    });
    setIsEditingCategory(true);
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (selectedCategory) {
      // Update existing category
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        data: categoryFormData
      });
    } else {
      // Create new category
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const handleSaveConfig = () => {
    updateConfigMutation.mutate(configFormData);
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      toast.error('Por favor ingresa un nuevo correo electrónico');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (newEmail === user?.email) {
      toast.error('El nuevo correo es igual al actual');
      return;
    }

    setIsChangingEmail(true);
    const { updateEmail } = useAuthStore.getState();
    const result = await updateEmail(newEmail);

    if (result.success) {
      toast.success('Hemos enviado un enlace de confirmación a tu nuevo correo');
      setNewEmail('');
    } else {
      toast.error(result.error || 'Error al cambiar el correo electrónico');
    }
    setIsChangingEmail(false);
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona la configuración del taller y usuarios del sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mi-cuenta">
            <Mail className="mr-2 h-4 w-4" />
            Mi Cuenta
          </TabsTrigger>
          <TabsTrigger value="general">
            <Building className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" />
            Usuarios ({users.length})
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="categorias">
            <Tag className="mr-2 h-4 w-4" />
            Categorías ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Apariencia
          </TabsTrigger>
          {isSuperAdmin() && (
            <TabsTrigger value="solicitudes" className="relative">
              <Clock className="mr-2 h-4 w-4" />
              Solicitudes
              {pendingApprovals.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Mi Cuenta Tab */}
        <TabsContent value="mi-cuenta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información de la Cuenta
              </CardTitle>
              <CardDescription>
                Administra tu información personal y configuración de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Nombre Completo</Label>
                  <p className="text-sm text-muted-foreground mt-1">{user?.full_name}</p>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Rol</Label>
                  <div className="mt-2">
                    <Badge variant="default">
                      {user?.role === 'admin' && 'Administrador'}
                      {user?.role === 'reception' && 'Recepción'}
                      {user?.role === 'mechanic_lead' && 'Jefe de Mecánicos'}
                      {user?.role === 'technician' && 'Técnico'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Change Email Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Correo Electrónico</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Correo actual: <span className="font-medium text-foreground">{user?.email}</span>
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <Label htmlFor="new-email">Nuevo Correo Electrónico</Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="nuevo@ejemplo.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={isChangingEmail}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Se enviará un enlace de confirmación al nuevo correo
                      </p>
                    </div>

                    <Button
                      onClick={handleChangeEmail}
                      disabled={isChangingEmail || !newEmail}
                      className="w-full sm:w-auto"
                    >
                      {isChangingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Solicitar Cambio de Correo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Acerca del cambio de correo
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Recibirás un correo de confirmación en tu nueva dirección</li>
                    <li>• Deberás hacer clic en el enlace para confirmar el cambio</li>
                    <li>• Tu correo actual seguirá activo hasta que confirmes el cambio</li>
                    <li>• Si no confirmas el cambio, tu correo actual permanecerá sin cambios</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Edit mode banner */}
          {configExists && !isEditingConfig && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  La configuración del taller ya está establecida
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditingConfig(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Información general del taller</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workshop-name">Nombre del Taller *</Label>
                  <Input
                    id="workshop-name"
                    value={configFormData.name || ''}
                    onChange={(e) => setConfigFormData({ ...configFormData, name: e.target.value })}
                    placeholder="Nombre del taller"
                    disabled={configExists && !isEditingConfig}
                  />
                </div>
                <div>
                  <Label htmlFor="workshop-address">Dirección</Label>
                  <Textarea
                    id="workshop-address"
                    value={configFormData.address || ''}
                    onChange={(e) => setConfigFormData({ ...configFormData, address: e.target.value })}
                    placeholder="Dirección completa del taller"
                    rows={3}
                    disabled={configExists && !isEditingConfig}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workshop-phone">Teléfono</Label>
                    <Input
                      id="workshop-phone"
                      value={configFormData.phone || ''}
                      onChange={(e) => setConfigFormData({ ...configFormData, phone: e.target.value })}
                      placeholder="(503) 1234-5678"
                      disabled={configExists && !isEditingConfig}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workshop-email">Email</Label>
                    <Input
                      id="workshop-email"
                      type="email"
                      value={configFormData.email || ''}
                      onChange={(e) => setConfigFormData({ ...configFormData, email: e.target.value })}
                      placeholder="contacto@taller.com"
                      disabled={configExists && !isEditingConfig}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Fiscal</CardTitle>
                <CardDescription>Datos fiscales del taller</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tax-id">NIT/RUC</Label>
                  <Input
                    id="tax-id"
                    value={configFormData.tax_id || ''}
                    onChange={(e) => setConfigFormData({ ...configFormData, tax_id: e.target.value })}
                    placeholder="1234567890123"
                    disabled={configExists && !isEditingConfig}
                  />
                </div>
                <div>
                  <Label htmlFor="tax-regime">Régimen Fiscal</Label>
                  <Select
                    value={configFormData.tax_regime || 'general'}
                    onValueChange={(value) => setConfigFormData({ ...configFormData, tax_regime: value })}
                    disabled={configExists && !isEditingConfig}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Régimen General</SelectItem>
                      <SelectItem value="simplified">Régimen Simplificado</SelectItem>
                      <SelectItem value="small">Pequeño Contribuyente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={configFormData.currency || 'USD'}
                    onValueChange={(value) => setConfigFormData({ ...configFormData, currency: value })}
                    disabled={configExists && !isEditingConfig}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                      <SelectItem value="SVC">Colón Salvadoreño (SVC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order-prefix">Prefijo de Órdenes</Label>
                  <Input
                    id="order-prefix"
                    value={configFormData.order_prefix || 'ORD'}
                    onChange={(e) => setConfigFormData({ ...configFormData, order_prefix: e.target.value.toUpperCase() })}
                    placeholder="ORD"
                    maxLength={5}
                    disabled={configExists && !isEditingConfig}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            {isEditingConfig && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingConfig(false);
                  // Reset form to original values
                  if (config) setConfigFormData(config);
                }}
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending || (configExists && !isEditingConfig)}
            >
              {updateConfigMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="usuarios" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Gestión de Usuarios</h3>
              <p className="text-sm text-muted-foreground">
                Administra los usuarios del sistema
              </p>
            </div>
            <Button onClick={handleNewUser}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={userColumns}
              data={users}
              searchKey="full_name"
              searchPlaceholder="Buscar usuarios..."
            />
          )}
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          {/* Twilio Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Estado de Twilio
              </CardTitle>
              <CardDescription>
                Integración con Twilio para envío de mensajes WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {twilioStatusLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Verificando configuración...</span>
                </div>
              ) : twilioStatus?.configured ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Twilio Configurado
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Los mensajes se enviarán a través de Twilio WhatsApp API
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Modo</p>
                      <p className="font-medium flex items-center gap-2">
                        {twilioStatus.mode === 'sandbox' ? (
                          <>
                            <Badge variant="secondary">Sandbox</Badge>
                            <span className="text-xs text-muted-foreground">(Desarrollo)</span>
                          </>
                        ) : (
                          <>
                            <Badge variant="default">Producción</Badge>
                            <span className="text-xs text-muted-foreground">(En vivo)</span>
                          </>
                        )}
                      </p>
                    </div>
                    {twilioStatus.whatsappNumber && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Número WhatsApp</p>
                        <p className="font-medium">{twilioStatus.whatsappNumber}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchTwilioStatus()}
                  >
                    <Loader2 className="mr-2 h-4 w-4" />
                    Verificar Conexión
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <XCircle className="h-6 w-6 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        Twilio No Configurado
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Configure las variables de entorno en Vercel para habilitar el envío de mensajes
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Variables requeridas en Vercel:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 font-mono">
                      <li>• TWILIO_ACCOUNT_SID</li>
                      <li>• TWILIO_AUTH_TOKEN</li>
                      <li>• TWILIO_WHATSAPP_NUMBER</li>
                      <li>• TWILIO_USE_SANDBOX (true/false)</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de WhatsApp en la Aplicación</CardTitle>
              <CardDescription>
                Configura las opciones de WhatsApp dentro de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="whatsapp-enabled" className="text-base">
                    Habilitar WhatsApp
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Activa las notificaciones por WhatsApp en la aplicación
                  </p>
                </div>
                <Switch
                  id="whatsapp-enabled"
                  checked={configFormData.whatsapp_enabled ?? false}
                  onCheckedChange={(checked) =>
                    setConfigFormData({ ...configFormData, whatsapp_enabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="whatsapp-number">Número WhatsApp del Taller (para mostrar)</Label>
                  <Input
                    id="whatsapp-number"
                    value={configFormData.whatsapp_business_number || ''}
                    onChange={(e) =>
                      setConfigFormData({ ...configFormData, whatsapp_business_number: e.target.value })
                    }
                    placeholder="+503 1234-5678"
                    disabled={!configFormData.whatsapp_enabled}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Número que se mostrará a los clientes (el envío usa Twilio)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sandbox Info Card */}
          {twilioStatus?.mode === 'sandbox' && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Modo Sandbox Activo
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Los destinatarios deben unirse al sandbox primero</li>
                      <li>• Envía &quot;join [código]&quot; al número de Twilio sandbox</li>
                      <li>• Solo para pruebas de desarrollo</li>
                      <li>• Para producción, solicita un número de WhatsApp Business aprobado</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categorias" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Categorías de Gastos</h3>
              <p className="text-sm text-muted-foreground">
                Administra las categorías para clasificar gastos
              </p>
            </div>
            <Button onClick={handleNewCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={categoryColumns}
              data={categories}
              searchKey="name"
              searchPlaceholder="Buscar categorías..."
            />
          )}
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Color Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Colores de Marca
                </CardTitle>
                <CardDescription>
                  Personaliza los colores de la página de inicio y login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primary-color" className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4" />
                      Color Primario
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Color principal usado en botones y acentos (ej: naranja tuning)
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primary-color"
                        type="color"
                        value={configFormData.primary_color || '#f97316'}
                        onChange={(e) =>
                          setConfigFormData({ ...configFormData, primary_color: e.target.value })
                        }
                        className="w-16 h-12 cursor-pointer p-1"
                      />
                      <Input
                        value={configFormData.primary_color || '#f97316'}
                        onChange={(e) =>
                          setConfigFormData({ ...configFormData, primary_color: e.target.value })
                        }
                        placeholder="#f97316"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="secondary-color" className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4" />
                      Color Secundario
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Color secundario para degradados y efectos (ej: rojo racing)
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={configFormData.secondary_color || '#ef4444'}
                        onChange={(e) =>
                          setConfigFormData({ ...configFormData, secondary_color: e.target.value })
                        }
                        className="w-16 h-12 cursor-pointer p-1"
                      />
                      <Input
                        value={configFormData.secondary_color || '#ef4444'}
                        onChange={(e) =>
                          setConfigFormData({ ...configFormData, secondary_color: e.target.value })
                        }
                        placeholder="#ef4444"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quick Presets */}
                <div>
                  <Label className="mb-3 block">Paletas Predefinidas</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfigFormData({
                        ...configFormData,
                        primary_color: '#f97316',
                        secondary_color: '#ef4444'
                      })}
                      className="h-auto py-2 flex flex-col gap-1"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f97316' }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                      </div>
                      <span className="text-xs">Tuning</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfigFormData({
                        ...configFormData,
                        primary_color: '#3b82f6',
                        secondary_color: '#06b6d4'
                      })}
                      className="h-auto py-2 flex flex-col gap-1"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
                      </div>
                      <span className="text-xs">Tech</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfigFormData({
                        ...configFormData,
                        primary_color: '#22c55e',
                        secondary_color: '#84cc16'
                      })}
                      className="h-auto py-2 flex flex-col gap-1"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#84cc16' }} />
                      </div>
                      <span className="text-xs">Eco</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfigFormData({
                        ...configFormData,
                        primary_color: '#a855f7',
                        secondary_color: '#ec4899'
                      })}
                      className="h-auto py-2 flex flex-col gap-1"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#a855f7' }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ec4899' }} />
                      </div>
                      <span className="text-xs">Moderno</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfigFormData({
                        ...configFormData,
                        primary_color: '#eab308',
                        secondary_color: '#f59e0b'
                      })}
                      className="h-auto py-2 flex flex-col gap-1"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#eab308' }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                      </div>
                      <span className="text-xs">Clásico</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfigFormData({
                        ...configFormData,
                        primary_color: '#dc2626',
                        secondary_color: '#991b1b'
                      })}
                      className="h-auto py-2 flex flex-col gap-1"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#dc2626' }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#991b1b' }} />
                      </div>
                      <span className="text-xs">Racing</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista Previa
                </CardTitle>
                <CardDescription>
                  Así se verá tu página de login
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="relative rounded-lg overflow-hidden border"
                  style={{ height: '400px' }}
                >
                  {/* Mini Login Preview */}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${configFormData.primary_color || '#f97316'} 0%, ${configFormData.secondary_color || '#ef4444'} 100%)`
                    }}
                  >
                    {/* Preview Card */}
                    <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 w-[85%] max-w-[280px]">
                      {/* Logo Preview */}
                      <div className="text-center mb-4">
                        <div
                          className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2"
                          style={{
                            background: `linear-gradient(135deg, ${configFormData.primary_color || '#f97316'} 0%, ${configFormData.secondary_color || '#ef4444'} 100%)`
                          }}
                        >
                          <Wrench className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="text-sm font-bold">{configFormData.name || 'Tu Taller'}</h3>
                        <p className="text-[10px] text-muted-foreground">Sistema de Gestión</p>
                      </div>

                      {/* Form Preview */}
                      <div className="space-y-3">
                        <div className="h-8 bg-muted/50 rounded-md border" />
                        <div className="h-8 bg-muted/50 rounded-md border" />
                        <div
                          className="h-8 rounded-md flex items-center justify-center text-white text-xs font-medium"
                          style={{
                            background: `linear-gradient(135deg, ${configFormData.primary_color || '#f97316'} 0%, ${configFormData.secondary_color || '#ef4444'} 100%)`
                          }}
                        >
                          Iniciar Sesión
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div
                    className="absolute top-4 right-4 w-20 h-20 rounded-full opacity-20"
                    style={{ backgroundColor: configFormData.secondary_color || '#ef4444' }}
                  />
                  <div
                    className="absolute bottom-4 left-4 w-16 h-16 rounded-full opacity-20"
                    style={{ backgroundColor: configFormData.primary_color || '#f97316' }}
                  />
                </div>

                {/* Preview Labels */}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: configFormData.primary_color || '#f97316' }}
                    />
                    <span>Primario</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: configFormData.secondary_color || '#ef4444' }}
                    />
                    <span>Secundario</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Colores
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Pending Approvals Tab - Only for Super Admin */}
        {isSuperAdmin() && (
          <TabsContent value="solicitudes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Solicitudes de Registro Pendientes
                </CardTitle>
                <CardDescription>
                  Revisa y aprueba las solicitudes de nuevos usuarios que desean acceder al sistema.
                  Solo tú (super administrador) puedes aprobar estas solicitudes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApprovalsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((pendingUser) => (
                      <div
                        key={pendingUser.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-orange-500">
                              {pendingUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{pendingUser.full_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {pendingUser.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {pendingUser.role === 'admin' && 'Administrador'}
                                {pendingUser.role === 'reception' && 'Recepción'}
                                {pendingUser.role === 'mechanic_lead' && 'Jefe de Mecánicos'}
                                {pendingUser.role === 'technician' && 'Técnico'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Solicitado: {new Date(pendingUser.created_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => rejectUserMutation.mutate(pendingUser.id)}
                            disabled={rejectUserMutation.isPending}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveUserMutation.mutate(pendingUser.id)}
                            disabled={approveUserMutation.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Acerca de las aprobaciones
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Cuando apruebas un usuario, podrá acceder al sistema inmediatamente</li>
                      <li>• Los usuarios aprobados aparecerán en la pestaña &quot;Usuarios&quot;</li>
                      <li>• Puedes cambiar el rol de un usuario después de aprobarlo</li>
                      <li>• Si rechazas una solicitud, el usuario deberá registrarse nuevamente</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? 'Actualiza la información del usuario'
                : 'Crea un nuevo usuario del sistema'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Nombre Completo *</Label>
              <Input
                id="user-name"
                value={userFormData.full_name}
                onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="juan@ejemplo.com"
                disabled={!!selectedUser}
              />
              {selectedUser && (
                <p className="text-sm text-muted-foreground mt-1">
                  El email no se puede modificar
                </p>
              )}
            </div>

            {!selectedUser && (
              <>
                <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                  <Switch
                    id="send-invite"
                    checked={userFormData.sendInvite}
                    onCheckedChange={(checked) =>
                      setUserFormData({ ...userFormData, sendInvite: checked, password: '' })
                    }
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="send-invite" className="text-sm font-medium cursor-pointer">
                      Enviar email de invitacion
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {userFormData.sendInvite
                        ? 'El usuario recibira un email para establecer su propia contrasena'
                        : 'Tu defines la contrasena inicial del usuario'}
                    </p>
                  </div>
                </div>

                {!userFormData.sendInvite && (
                  <div>
                    <Label htmlFor="user-password">Contrasena *</Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={userFormData.password || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      placeholder="Minimo 6 caracteres"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Comparte esta contrasena de forma segura con el usuario
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="user-phone">Teléfono</Label>
              <Input
                id="user-phone"
                value={userFormData.phone || ''}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="(503) 1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="user-role">Rol *</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value: 'admin' | 'reception' | 'mechanic_lead' | 'technician') => setUserFormData({ ...userFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="reception">Recepción</SelectItem>
                  <SelectItem value="mechanic_lead">Jefe de Mecánicos</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="user-active"
                  checked={userFormData.is_active}
                  onCheckedChange={(checked) =>
                    setUserFormData({ ...userFormData, is_active: checked })
                  }
                />
                <Label htmlFor="user-active">Usuario activo</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUserDialogOpen(false);
                resetUserForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Usuario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Actualiza la información de la categoría'
                : 'Crea una nueva categoría de gastos'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nombre *</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="Servicios, Mantenimiento, etc."
              />
            </div>

            <div>
              <Label htmlFor="category-description">Descripción</Label>
              <Textarea
                id="category-description"
                value={categoryFormData.description || ''}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, description: e.target.value })
                }
                placeholder="Descripción de la categoría (opcional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="category-color"
                  type="color"
                  value={categoryFormData.color || '#3b82f6'}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={categoryFormData.color || '#3b82f6'}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, color: e.target.value })
                  }
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCategoryDialogOpen(false);
                resetCategoryForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Categoría'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La categoría será eliminada permanentemente.
              Si tiene gastos asociados, no se podrá eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate(categoryToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation - Super Admin Only */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar Usuario
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>¿Estás seguro que deseas eliminar a este usuario?</p>
              {userToDelete && (
                <div className="bg-muted p-3 rounded-lg mt-2">
                  <p className="font-medium">{userToDelete.full_name}</p>
                  <p className="text-sm text-muted-foreground">{userToDelete.email}</p>
                </div>
              )}
              <p className="text-red-600 font-medium mt-2">
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate(userToDelete.id);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Usuario'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
