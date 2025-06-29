# Calisthenics Delete Confirmation Component

This component provides a beautiful, calisthenics-themed delete confirmation dialog that can be used throughout the app.

## Features

- 🎨 Calisthenics-themed design with gradient backgrounds
- 🔥 Animated icons and visual feedback
- 🌓 Dark/light mode support
- ⚡ Framer Motion animations
- 🎯 Customizable content and styling
- 🔄 Loading states with visual feedback

## Usage

```tsx
import CalisthenicsDeleteConfirmation from '@/components/calisthenics/CalisthenicsDeleteConfirmation';

// Basic usage
<CalisthenicsDeleteConfirmation
  trigger={<Button variant="destructive">Delete</Button>}
  itemName="My Workout Plan"
  itemType="workout plan"
  onConfirm={() => handleDelete()}
  isDark={isDark}
/>

// Advanced usage with custom content
<CalisthenicsDeleteConfirmation
  trigger={
    <Button variant="ghost" size="sm">
      <Trash2 className="w-4 h-4" />
    </Button>
  }
  itemName="Push-up Routine"
  itemType="exercise routine"
  onConfirm={() => deleteRoutine()}
  isDark={isDark}
  isLoading={isDeleting}
  title="Remove Exercise Routine?"
  description="This will permanently remove your custom exercise routine and all associated progress data."
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `trigger` | `React.ReactNode` | ✅ | The element that triggers the dialog |
| `itemName` | `string` | ✅ | Name of the item being deleted |
| `itemType` | `string` | ❌ | Type of item (default: "item") |
| `onConfirm` | `() => void` | ✅ | Function called when delete is confirmed |
| `isDark` | `boolean` | ❌ | Dark mode flag (default: false) |
| `isLoading` | `boolean` | ❌ | Loading state (default: false) |
| `title` | `string` | ❌ | Custom dialog title |
| `description` | `string` | ❌ | Custom dialog description |

## Design Elements

### Color Scheme
- **Primary**: Red to Orange gradient (danger/warning)
- **Secondary**: Purple accents for branding
- **Background**: Glassmorphism with backdrop blur
- **Text**: Adaptive colors based on dark/light mode

### Animations
- **Entry**: Scale and rotate animation for icon
- **Hover**: Scale and shadow effects for buttons
- **Loading**: Spinning flame icon with pulsing background
- **Shimmer**: Sliding gradient effect on delete button

### Layout
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Modern**: Rounded corners and smooth transitions

## Examples in App

### Quick Log Items
Used in `/quick-log` page for deleting food presets:
```tsx
<CalisthenicsDeleteConfirmation
  trigger={<Button>Delete</Button>}
  itemName="Chicken Breast"
  itemType="quick item"
  onConfirm={() => handleDelete(item.id)}
  isDark={isDark}
  isLoading={deletingItemId === item.id}
/>
```

### Workout Plans
Could be used in workout plan management:
```tsx
<CalisthenicsDeleteConfirmation
  trigger={<Button>Remove Plan</Button>}
  itemName="Beast Mode Training"
  itemType="workout plan"
  onConfirm={() => deletePlan(plan.id)}
  isDark={isDark}
/>
```

### Exercise Routines
Perfect for exercise management:
```tsx
<CalisthenicsDeleteConfirmation
  trigger={<IconButton><Trash2 /></IconButton>}
  itemName="Morning Calisthenics"
  itemType="routine"
  onConfirm={() => removeRoutine(routine.id)}
  isDark={isDark}
  title="Delete Exercise Routine?"
  description="This will remove your routine and all associated progress data."
/>
```

## Customization

The component is fully customizable and follows the app's design system:

- **Theming**: Automatically adapts to dark/light mode
- **Branding**: Uses consistent calisthenics color scheme
- **Typography**: Follows app's font hierarchy
- **Spacing**: Uses consistent padding and margins
- **Animations**: Smooth transitions and micro-interactions

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Focus management
- ✅ High contrast support
- ✅ Clear visual hierarchy
