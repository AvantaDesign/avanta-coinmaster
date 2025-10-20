# Admin Dashboard - Visual Guide

## Dashboard Layout Preview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Avanta Finance                                       [User] [Logout]     │
│  [Dashboard] [Transacciones] [Cuentas] ... [Mi Cuenta] ← New Link       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  Panel de Administración                                                  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Información de la Cuenta                                          │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │                                                                     │  │
│  │  ┌───┐  Mateo Reyes                     Usuario ID: admin_001      │  │
│  │  │ M │  m@avantadesign.com               Registro: Oct 16, 2025    │  │
│  │  └───┐  [Administrador]                  Último login: 5:30 PM     │  │
│  │                                                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Configuración del Perfil                                          │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │                                                                     │  │
│  │  Nombre                                                   [Editar]  │  │
│  │  Mateo Reyes                                                        │  │
│  │                                                                     │  │
│  │  Email                                                              │  │
│  │  m@avantadesign.com                                                 │  │
│  │  El email no se puede cambiar                                       │  │
│  │                                                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Cambiar Contraseña                                                │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │                                                                     │  │
│  │  Contraseña Actual                                                  │  │
│  │  [••••••••••••••••••••]                                            │  │
│  │                                                                     │  │
│  │  Nueva Contraseña                                                   │  │
│  │  [••••••••••••••••••••]                                            │  │
│  │  Mínimo 8 caracteres, con mayúsculas, minúsculas y números         │  │
│  │                                                                     │  │
│  │  Confirmar Nueva Contraseña                                         │  │
│  │  [••••••••••••••••••••]                                            │  │
│  │                                                                     │  │
│  │  ☐ Mostrar contraseñas                                              │  │
│  │                                                                     │  │
│  │                                    [Cambiar Contraseña]             │  │
│  │                                                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  🔒 Seguridad de tu Cuenta                                         │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  • Tus contraseñas están protegidas con hash SHA-256 y salt único  │  │
│  │  • Las sesiones expiran automáticamente después de 24 horas        │  │
│  │  • Todos los datos financieros están cifrados en tránsito          │  │
│  │  • Tu información está aislada de otros usuarios                   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

## Color Scheme

- **Background**: Light gray (#F3F4F6)
- **Cards**: White with shadow
- **Primary Button**: Blue (#3B82F6) hover (#2563EB)
- **Admin Badge**: Purple (#8B5CF6)
- **Text**: Dark gray (#111827)
- **Labels**: Medium gray (#6B7280)
- **Security Box**: Light blue (#EFF6FF)

## Component States

### 1. Name Editing Mode
```
┌────────────────────────────────────────────────────────┐
│  Nombre                                                │
│  [Mateo Reyes_______________] [Guardar] [Cancelar]    │
└────────────────────────────────────────────────────────┘
```

### 2. Password Validation Errors
```
┌────────────────────────────────────────────────────────┐
│  Nueva Contraseña                                      │
│  [abc_______________________________]                  │
│  ❌ Password must be at least 8 characters             │
└────────────────────────────────────────────────────────┘
```

### 3. Success Notification
```
┌────────────────────────────────────────────────────────┐
│  ✅ Password changed successfully                      │
└────────────────────────────────────────────────────────┘
```

### 4. Show Passwords Mode
```
┌────────────────────────────────────────────────────────┐
│  Contraseña Actual                                     │
│  [AvantaAdmin2025!___________________]                 │
│                                                        │
│  Nueva Contraseña                                      │
│  [NewSecure123!______________________]                 │
│                                                        │
│  ☑ Mostrar contraseñas                                 │
└────────────────────────────────────────────────────────┘
```

## Responsive Design

### Desktop (1024px+)
- Two-column layout for account overview
- Full-width form fields
- Side-by-side buttons

### Tablet (768px)
- Single column layout
- Stacked information
- Full-width buttons

### Mobile (375px)
- Single column
- Larger touch targets
- Stacked buttons

## Interactive Elements

### Hover States
- Buttons: Darker shade on hover
- Edit link: Underline on hover
- Text color change: Blue to darker blue

### Focus States
- Input fields: Blue ring on focus
- Buttons: Ring and outline
- Keyboard navigation supported

### Loading States
- Button text: "Cambiando..." during password change
- Spinner: Shows while loading profile
- Disabled state: Opacity 50%, no hover

## Accessibility Features

- ✅ Keyboard navigation
- ✅ Screen reader labels
- ✅ ARIA attributes
- ✅ Color contrast (WCAG AA)
- ✅ Focus indicators
- ✅ Error messages linked to fields

## Animation & Transitions

- Smooth fade-in on load
- Input focus: 150ms transition
- Button hover: 150ms transition
- Notification: Slide in from top

## User Flow

```
Login → Home → Click "Mi Cuenta" → Admin Dashboard
                                           ↓
                              ┌────────────┴────────────┐
                              ↓                         ↓
                        Edit Profile              Change Password
                              ↓                         ↓
                        Update Name              Validate & Update
                              ↓                         ↓
                        Save Success             Success → Logout
```

## Password Change Flow

```
Enter Current Password
         ↓
    Verify Current
         ↓
    Enter New Password
         ↓
    Validate Strength:
    - Length ≥ 8
    - Has uppercase
    - Has lowercase
    - Has number
         ↓
    Confirm Password
         ↓
    Passwords Match?
         ↓
    Hash New Password
         ↓
    Update Database
         ↓
    Show Success
         ↓
    Clear Form
```

## Error Messages

**Current Password Errors:**
- "Current password is required"
- "Current password is incorrect"

**New Password Errors:**
- "New password is required"
- "Password must be at least 8 characters"
- "Password must contain at least one uppercase letter"
- "Password must contain at least one lowercase letter"
- "Password must contain at least one number"

**Confirmation Errors:**
- "Passwords do not match"

**Network Errors:**
- "Error loading profile"
- "Failed to update profile"
- "Failed to change password"

## Success Messages

- "Profile updated successfully"
- "Password changed successfully"

## Mobile Viewport Example

```
┌──────────────────────────┐
│ Avanta Finance      [≡]  │
├──────────────────────────┤
│                          │
│ Panel de Administración  │
│                          │
│ ┌──────────────────────┐ │
│ │ ┌─┐                  │ │
│ │ │M│ Mateo Reyes      │ │
│ │ └─┘ [Administrador]  │ │
│ │                      │ │
│ │ m@avantadesign.com   │ │
│ │ admin_001            │ │
│ │ Oct 16, 2025         │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ Nombre      [Editar] │ │
│ │ Mateo Reyes          │ │
│ │                      │ │
│ │ Email                │ │
│ │ m@avantadesign.com   │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ Cambiar Contraseña   │ │
│ │                      │ │
│ │ [•••••••••••••••]    │ │
│ │ [•••••••••••••••]    │ │
│ │ [•••••••••••••••]    │ │
│ │                      │ │
│ │ [Cambiar Contraseña] │ │
│ └──────────────────────┘ │
│                          │
└──────────────────────────┘
```

## Technical Implementation

**Component Structure:**
```
AdminDashboard
├── Account Overview Section
│   ├── Avatar/Initial Display
│   ├── User Information
│   └── Admin Badge
├── Profile Settings Section
│   ├── Name Editor
│   └── Email Display
├── Password Change Section
│   ├── Current Password Input
│   ├── New Password Input
│   ├── Confirm Password Input
│   └── Submit Button
└── Security Information Section
    └── Security Features List
```

**State Management:**
- `profile` - User profile data
- `loading` - Loading state
- `editingName` - Name edit mode
- `currentPassword` - Current password value
- `newPassword` - New password value
- `confirmPassword` - Confirm password value
- `showPasswords` - Password visibility toggle
- `passwordErrors` - Validation errors object

**API Calls:**
- `fetchProfile()` - GET /api/user-profile
- `handleUpdateName()` - PUT /api/user-profile
- `handleChangePassword()` - POST /api/user-profile/change-password
