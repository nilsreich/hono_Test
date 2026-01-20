/**
 * @file validation/schemas.ts
 * @description Zod-Schemas für die API-Eingabe-Validierung.
 * 
 * WARUM ZOD?
 * - Typsichere Validierung mit automatischer TypeScript-Integration
 * - Klare, deklarative Schema-Definitionen
 * - @hono/zod-validator Integration für Middleware-basierte Validierung
 * - Bessere Fehlermeldungen für API-Clients
 * 
 * PATTERN: Schema → Middleware → Route
 * - Schema definiert die erwartete Struktur
 * - zValidator() erstellt Middleware aus Schema
 * - Middleware wird in Route eingebunden
 */

import { z } from 'zod'

// ===================
// Auth Schemas
// ===================

/**
 * Schema für Login und Signup Requests.
 * 
 * REGELN:
 * - username: 3-50 Zeichen, nur alphanumerisch + _ und -
 * - password: 8-128 Zeichen, beliebige Zeichen erlaubt
 */
export const authSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
})

/** TypeScript-Typ aus Schema ableiten */
export type AuthInput = z.infer<typeof authSchema>

/**
 * Schema für Signup mit optionaler E-Mail.
 */
export const signupSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional(),
})

/** TypeScript-Typ aus Schema ableiten */
export type SignupInput = z.infer<typeof signupSchema>

// ===================
// Password Reset Schemas
// ===================

/**
 * Schema für Passwort-vergessen-Anfrage.
 * Erwartet eine gültige E-Mail-Adresse.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address'),
})

/** TypeScript-Typ aus Schema ableiten */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Schema für Passwort-Reset.
 * Erwartet Token und neues Passwort.
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({ message: 'Reset token is required' })
    .uuid('Invalid reset token'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
})

// ===================
// Entry Schemas
// ===================

/**
 * Schema für Entry-Erstellung.
 * 
 * REGELN:
 * - text: Nicht leer, maximal 10000 Zeichen
 */
export const entrySchema = z.object({
  text: z
    .string({ message: 'Entry text is required' })
    .min(1, 'Entry text cannot be empty')
    .max(10000, 'Entry text cannot exceed 10000 characters')
    .transform((val) => val.trim()),
})

/** TypeScript-Typ aus Schema ableiten */
export type EntryInput = z.infer<typeof entrySchema>

// ===================
// File Upload Schemas
// ===================

/**
 * Erlaubte MIME-Types für Datei-Uploads.
 * Eingeschränkt auf sichere, gängige Dateitypen.
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
] as const

/** Maximale Dateigröße: 5 MB */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Schema für Datei-Metadaten (JSON-Teil des multipart Requests).
 * Optional: Beschreibung der Datei.
 */
export const fileMetadataSchema = z.object({
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
})

/** TypeScript-Typ aus Schema ableiten */
export type FileMetadataInput = z.infer<typeof fileMetadataSchema>

/** TypeScript-Typ für Reset-Passwort-Input ableiten */
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
