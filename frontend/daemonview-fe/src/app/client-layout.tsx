'use client';

import StyledComponentsRegistry from './registry';
import { LoadingProvider } from './context/LoadingContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyledComponentsRegistry>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </StyledComponentsRegistry>
  );
} 