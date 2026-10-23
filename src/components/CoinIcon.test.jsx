import { render, fireEvent } from '@testing-library/react'
import { expect, it } from 'vitest'
import CoinIcon from './CoinIcon.jsx'
it('uses bundled artwork and keeps a visible fallback if image hosts fail', () => {
  const { container, rerender } = render(<CoinIcon id="ethereum" symbol="ETH" />)
  expect(container.querySelector('img')).toHaveAttribute('src', '/coin-icons/eth.svg')
  rerender(<CoinIcon id="unknown" symbol="NEW" image="https://example.test/broken.png" />)
  fireEvent.error(container.querySelector('img'))
  expect(container.querySelector('img')).toBeNull()
  expect(container).toHaveTextContent('NEW')
})
