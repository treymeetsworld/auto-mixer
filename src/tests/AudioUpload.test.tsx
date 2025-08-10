import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { AudioUpload } from '../components/controls/AudioUpload'

describe('AudioUpload Component', () => {
  it('should render file input and label', () => {
    const mockOnFileUpload = vi.fn()
    
    render(<AudioUpload onFileUpload={mockOnFileUpload} />)
    
    // Check that the label text is rendered
    const labelText = screen.getByText(/add track/i)
    expect(labelText).toBeInTheDocument()
    
    // Check that the file input exists
    const fileInput = document.querySelector('#audio-upload') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    expect(fileInput.type).toBe('file')
    expect(fileInput.accept).toBe('audio/*')
  })

  it('should trigger onFileUpload when file is selected', async () => {
    const mockOnFileUpload = vi.fn()
    
    render(<AudioUpload onFileUpload={mockOnFileUpload} />)
    
    const fileInput = document.querySelector('#audio-upload') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    
    const file = new File(['dummy content'], 'test.mp3', { type: 'audio/mpeg' })
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true })
    fileInput.dispatchEvent(changeEvent)
    
    expect(mockOnFileUpload).toHaveBeenCalledWith(expect.any(Object))
  })

  it('should trigger onFileUpload even when no file is selected', () => {
    const mockOnFileUpload = vi.fn()
    
    render(<AudioUpload onFileUpload={mockOnFileUpload} />)
    
    const fileInput = document.querySelector('#audio-upload') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    
    // Simulate no file selection
    Object.defineProperty(fileInput, 'files', {
      value: [],
      writable: false,
    })
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true })
    fileInput.dispatchEvent(changeEvent)
    
    // The component still calls the handler - it's up to the parent to handle empty files
    expect(mockOnFileUpload).toHaveBeenCalledWith(expect.any(Object))
  })
})
