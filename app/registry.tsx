'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

export default function StyledComponentsRegistry({ children }: { children: React.ReactNode }) {
  // Lazily initialize the ServerStyleSheet instance once
  const [shareableSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = shareableSheet.getStyleElement();
    shareableSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={shareableSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}