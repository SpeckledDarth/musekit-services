# @musekit/shared Exports

This package exposes the following exports from `src/index.ts`.

## Types

- `User`
- `Organization`
- `TeamMember`
- `Subscription`
- `AuditLogEntry`
- `Notification`
- `BrandSettings`
- `FeatureToggle`
- `NavItem`
- `AppConfig`

## Utilities

- `cn(...inputs)`: Merges Tailwind CSS classes correctly
- `formatCurrency(amount, currency)`: Formats numbers into currency strings
- `formatDate(date)`: Formats a Date or string into a readable date string
- `slugify(text)`: Creates a URL-friendly slug from text
- `truncate(str, length)`: Truncates text and appends an ellipsis
- `generateId()`: Generates a random UUID

## Configuration

- `APP_CONFIG`: Standard configuration defaults for MuseKit (name, description, features)
