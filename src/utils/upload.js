import { API_URL } from '../config'

/**
 * Get authorization headers for API requests
 */
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Upload a single image to Cloudinary via backend
 * @param {File|string} image - File object or base64 string
 * @param {string} folder - Folder name: 'messages', 'documents', 'moodboard', 'collage', 'profile'
 * @returns {Promise<{url: string, publicId: string, width: number, height: number}>}
 */
export async function uploadImage(image, folder = 'messages') {
  let imageData = image

  // Convert File to base64 if needed
  if (image instanceof File) {
    imageData = await fileToBase64(image)
  }

  const response = await fetch(`${API_URL}/api/upload/image`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ image: imageData, folder }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload image')
  }

  return response.json()
}

/**
 * Upload multiple images to Cloudinary via backend
 * @param {Array<File|string>} images - Array of File objects or base64 strings
 * @param {string} folder - Folder name
 * @returns {Promise<Array<{url: string, publicId: string, width: number, height: number}>>}
 */
export async function uploadImages(images, folder = 'messages') {
  const imageDataArray = await Promise.all(
    images.map(async (image) => {
      if (image instanceof File) {
        return fileToBase64(image)
      }
      return image
    })
  )

  const response = await fetch(`${API_URL}/api/upload/images`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ images: imageDataArray, folder }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload images')
  }

  return response.json()
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<{message: string}>}
 */
export async function deleteImage(publicId) {
  const headers = {}
  const token = localStorage.getItem('auth_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(
    `${API_URL}/api/upload/image/${encodeURIComponent(publicId)}`,
    {
      method: 'DELETE',
      headers,
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete image')
  }

  return response.json()
}

/**
 * Convert File to base64 string
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * @param {File} file
 * @param {Object} options
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImage(file, options = {}) {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
    }
  }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}
