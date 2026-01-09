import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NavigationHub from '../components/NavigationHub'

describe('NavigationHub', () => {
  const mockUser = { id: 1, username: 'TestUser' }
  const mockOnLogout = vi.fn()
  const mockOnNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the navigation hub with user greeting', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    expect(screen.getByText(/Welcome back, TestUser!/i)).toBeInTheDocument()
    expect(screen.getByText('Frella')).toBeInTheDocument()
  })

  it('renders all navigation options', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    expect(screen.getByText('To-Do List')).toBeInTheDocument()
    expect(screen.getByText('Spotify Share')).toBeInTheDocument()
    expect(screen.getByText('Messages')).toBeInTheDocument()
    expect(screen.getByText('Shared Documents')).toBeInTheDocument()
    expect(screen.getByText('Games')).toBeInTheDocument()
  })

  it('navigates to todo when To-Do List is clicked', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    fireEvent.click(screen.getByText('To-Do List'))
    expect(mockOnNavigate).toHaveBeenCalledWith('todo')
  })

  it('navigates to spotify when Spotify Share is clicked', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    fireEvent.click(screen.getByText('Spotify Share'))
    expect(mockOnNavigate).toHaveBeenCalledWith('spotify')
  })

  it('navigates to messages when Messages is clicked', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    fireEvent.click(screen.getByText('Messages'))
    expect(mockOnNavigate).toHaveBeenCalledWith('messages')
  })

  it('does not navigate when disabled item is clicked', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    // Shared Documents and Games are disabled
    fireEvent.click(screen.getByText('Shared Documents'))
    fireEvent.click(screen.getByText('Games'))
    
    expect(mockOnNavigate).not.toHaveBeenCalled()
  })

  it('shows "Soon" badge on disabled items', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    // Should have 2 "Soon" badges for Shared Documents and Games
    const soonBadges = screen.getAllByText('Soon')
    expect(soonBadges).toHaveLength(2)
  })

  it('calls onLogout when logout button is clicked', () => {
    render(
      <NavigationHub 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onNavigate={mockOnNavigate} 
      />
    )

    fireEvent.click(screen.getByText('Logout'))
    expect(mockOnLogout).toHaveBeenCalled()
  })
})
