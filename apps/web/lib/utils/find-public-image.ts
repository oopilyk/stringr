import { existsSync } from 'fs'
import { join } from 'path'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov']

function findPublicAsset(relativeDir: string, baseName: string, extensions: string[]): string | null {
  for (const ext of extensions) {
    const filename = `${baseName}.${ext}`
    if (existsSync(join(process.cwd(), 'public', relativeDir, filename))) {
      return `/${relativeDir}/${filename}`
    }
  }
  return null
}

/**
 * Looks for public/<relativeDir>/<baseName>.<ext> (server-side only) and
 * returns its public URL if found, so components can fall back to a
 * placeholder until a real image is dropped in.
 */
export function findPublicImage(relativeDir: string, baseName: string): string | null {
  return findPublicAsset(relativeDir, baseName, IMAGE_EXTENSIONS)
}

/**
 * Same as findPublicImage but for video backgrounds. Checks .mp4/.webm first
 * since .mov has inconsistent browser support outside Safari.
 */
export function findPublicVideo(relativeDir: string, baseName: string): string | null {
  return findPublicAsset(relativeDir, baseName, VIDEO_EXTENSIONS)
}
