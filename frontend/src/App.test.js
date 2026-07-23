import { render, screen } from '@testing-library/react';
import App from './App';

test('renders VoyageCraft AI header', () => {
  render(<App />);
  const headerElement = screen.getByText(/VoyageCraft AI/i);
  expect(headerElement).toBeInTheDocument();
});
