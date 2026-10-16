/**
 * Centralized file storage utilities.
 *
 * Why this exists:
 * - Ensures every uploaded file gets a globally unique UUID-based name so two
 *   uploads can never overwrite each other (no timestamp collisions).
 * - Stores files under `public/uploads/<folder>/<uuid>.<ext>` so they are
 *   served as static assets by Next.js and survive on Liara's Persistent Disk.
  * - Persists only the **public relative URL** (e.g. `/api/uploads/products/abc.webp`)
  *   in the database — never the absolute filesystem path.
 * - Provides a safe `deleteUpload` helper that only deletes files inside
 *   `public/uploads/` (path-traversal protected) and never throws.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_ROOT_SEGMENTS = ['public', 'uploads'];

/**
 * Resolve the absolute filesystem path of the `public/uploads` directory.
 * Always computed from `process.cwd()` so it works the same in dev and prod.
 */
const getCwd = () => process.cwd();
function uploadsRoot(): string {
  return path.join(/*turbopackIgnore: true*/ getCwd(), ...UPLOADS_ROOT_SEGMENTS);
}

/**
 * Allowed image mime types and their canonical file extension.
 * We normalize the extension to deter malicious tricks like `file.php.jpg`.
 */
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
};

export const ALLOWED_IMAGE_TYPES = Object.keys(MIME_TO_EXT);

/**
 * Given a mime type, return the canonical extension (without leading dot).
 * Returns `null` for disallowed types.
 */
export function extForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

/**
 * Sanitize a folder name. Only alphanumeric + dash + underscore allowed.
 * This is the subfolder under `public/uploads/` (e.g. "products", "brands").
 */
function sanitizeFolder(folder: string): string {
  const cleaned = folder.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) throw new Error(`Invalid storage folder: "${folder}"`);
  return cleaned;
}

/**
 * Save a Buffer to `public/uploads/<folder>/<uuid>.<ext>` and return the
 * public URL path that should be stored in the database.
 *
 * The destination directory is created with { recursive: true } if missing.
 *
 * @param folder  Subfolder under `public/uploads/` (e.g. "products", "hero")
 * @param mime    Original mime type (used to derive the extension)
 * @param data    File contents as a Buffer
 * @returns       Public URL path, e.g. `/api/uploads/products/a1b2c3d4-....webp`
 */
export async function saveUpload(
  folder: string,
  mime: string,
  data: Buffer
): Promise<string> {
  const ext = extForMime(mime);
  if (!ext) {
    throw new Error(`Unsupported mime type: ${mime}`);
  }

  const safeFolder = sanitizeFolder(folder);
  const dir = path.join(/*turbopackIgnore: true*/ uploadsRoot(), safeFolder);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const fullPath = `${dir}${path.sep}${filename}`;
  await fs.writeFile(fullPath, data);

  // Return public URL path (relative to /public)
return `/api/uploads/${safeFolder}/${filename}`;
  }

  /**
   * Save a raw Buffer with an explicit extension (bypasses mime→ext map).
   * Useful when we convert uploads to webp via sharp and want the output
   * extension to be `webp` regardless of the input mime type.
   */
  export async function saveUploadWithExt(
   folder: string,
   ext: string,
   data: Buffer
  ): Promise<string> {
   const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
   if (!safeExt) throw new Error(`Invalid extension: "${ext}"`);
   const safeFolder = sanitizeFolder(folder);
   const dir = path.join(/*turbopackIgnore: true*/ uploadsRoot(), safeFolder);
   await fs.mkdir(dir, { recursive: true });

   const filename = `${randomUUID()}.${safeExt}`;
   const fullPath = `${dir}${path.sep}${filename}`;
   await fs.writeFile(fullPath, data);

   return `/api/uploads/${safeFolder}/${filename}`;
}

/**
 * Save a sharp pipeline output stream to disk. Used when sharp processes the
 * image and writes the result directly (avoiding a double-write).
 *
 * Returns the public URL path after writing.
 */
export async function saveSharpOutput(
  folder: string,
  ext: string,
  writeFn: (fullPath: string) => Promise<unknown>
): Promise<string> {
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (!safeExt) throw new Error(`Invalid extension: "${ext}"`);
  const safeFolder = sanitizeFolder(folder);
  const dir = path.join(/*turbopackIgnore: true*/ uploadsRoot(), safeFolder);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${safeExt}`;
  const fullPath = `${dir}${path.sep}${filename}`;
  await writeFn(fullPath);

  return `/api/uploads/${safeFolder}/${filename}`;
}

/**
 * Convert a public URL path (e.g. `/api/uploads/products/abc.webp`) to its
 * absolute filesystem path. Returns `null` if the URL is not a valid upload
 * path under `public/uploads/` — this guard prevents path traversal attacks.
 *
 * Only URLs starting with `/api/uploads/` are considered. Anything else (external
 * URLs, `/logo.png`, etc.) returns null and is therefore un-deletable, which
 * is intentional: we must never delete files we didn't create.
 */
function urlToAbsolutePath(urlPath: string): string | null {
  if (!urlPath || typeof urlPath !== 'string') return null;
  if (!urlPath.startsWith('/api/uploads/')) return null;

  // Strip the leading "/api/uploads/" and split
  const relative = urlPath.slice('/api/uploads/'.length);
  if (!relative) return null;

  // Normalize and resolve safely under uploadsRoot()
  const target = path.resolve(/*turbopackIgnore: true*/ uploadsRoot(), relative);

  // Path-traversal guard: ensure the resolved path is still inside uploadsRoot()
  const root = uploadsRoot() + path.sep;
  if (!target.startsWith(root)) return null;

  return target;
}

/**
 * Delete a previously uploaded file by its public URL path.
 *
 * Safe to call with:
 * - `null` / `undefined` / `''` → no-op
 * - External URLs (`https://...`) → no-op (we never owned them)
 * - Files that don't exist on disk → silently ignored
 *
 * Never throws — the caller can rely on it always resolving.
 */
export async function deleteUpload(urlPath: string | null | undefined): Promise<void> {
  const abs = urlToAbsolutePath(urlPath ?? '');
  if (!abs) return;
  try {
    await fs.unlink(abs);
  } catch {
    // File may already be deleted, or permissions issue — never throw
  }
}

/**
 * Delete multiple uploads at once. Useful for cascading deletes
 * (e.g. when a product is removed, delete all its images).
 */
export async function deleteUploads(urlPaths: (string | null | undefined)[]): Promise<void> {
  await Promise.all(urlPaths.map((p) => deleteUpload(p)));
}

/**
 * Validate that a URL refers to one of our own uploads. Used to decide
 * whether we should attempt file deletion when replacing an image.
 */
export function isOurUpload(urlPath: string | null | undefined): boolean {
  return !!urlPath && urlPath.startsWith('/api/uploads/');
}
