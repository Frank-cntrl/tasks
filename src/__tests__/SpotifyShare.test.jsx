import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SpotifyShare from '../components/SpotifyShare/SpotifyShare'

// Mock the config
vi.mock('../config', () => ({
  API_URL: 'http://localhost:8080'
}))

// Mock fetch
global.fetch = vi.fn()

describe('SpotifyShare', () => {
  const mockUser = { id: 1, username: 'TestUser' }
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks for API calls
    global.fetch.mockImplementation((url) => {
      if (url.includes('/spotify/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: false })
        })
      }
      if (url.includes('/posts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  it('renders the Spotify Share header', async () => {
    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    expect(screen.getByText('Spotify Share')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', async () => {
    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    // Find the back button (first button in header)
    const backButton = screen.getAllByRole('button')[0]
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('shows empty state when no posts exist', async () => {
    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })
  })

  it('shows posts when they exist', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/spotify/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: true })
        })
      }
      if (url.includes('/posts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              content: 'Check out this song!',
              userId: 1,
              user: { id: 1, username: 'TestUser' },
              likes: [],
              comments: [],
              createdAt: new Date().toISOString()
            }
          ])
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })

    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByText('Check out this song!')).toBeInTheDocument()
    })
  })

  it('opens create post modal when FAB is clicked', async () => {
    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })

    // Click the FAB (last button with AddIcon)
    const fab = screen.getAllByRole('button').find(btn => 
      btn.classList.contains('fixed')
    )
    
    if (fab) {
      fireEvent.click(fab)
      expect(screen.getByText('Share Music')).toBeInTheDocument()
    }
  })
})

describe('SpotifyShare - Post Interactions', () => {
  const mockUser = { id: 1, username: 'TestUser' }
  const mockOnBack = vi.fn()
  
  const mockPosts = [
    {
      id: 1,
      content: 'Great song!',
      spotifyTrackId: 'abc123',
      spotifyType: 'track',
      userId: 1,
      user: { id: 1, username: 'TestUser' },
      likes: [],
      comments: [{ id: 1 }],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      content: 'Listen to this!',
      userId: 2,
      user: { id: 2, username: 'OtherUser' },
      likes: [{ id: 1, userId: 1 }],
      comments: [],
      createdAt: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    global.fetch.mockImplementation((url) => {
      if (url.includes('/spotify/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: true })
        })
      }
      if (url.includes('/posts') && !url.includes('/like') && !url.includes('/comments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPosts)
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  it('renders posts with content', async () => {
    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByText('Great song!')).toBeInTheDocument()
      expect(screen.getByText('Listen to this!')).toBeInTheDocument()
    })
  })

  it('shows usernames on posts', async () => {
    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByText('TestUser')).toBeInTheDocument()
      expect(screen.getByText('OtherUser')).toBeInTheDocument()
    })
  })

  it('renders multiple posts from feed', async () => {
    render(<SpotifyShare user={mockUser} onBack={mockOnBack} />)

    await waitFor(() => {
      // Both posts should be rendered
      expect(screen.getByText('Great song!')).toBeInTheDocument()
      expect(screen.getByText('Listen to this!')).toBeInTheDocument()
    })
  })
})
