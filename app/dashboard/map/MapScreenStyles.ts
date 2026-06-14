import styled from 'styled-components';

export const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #e5e5ea;
`;

export const BannerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 120;
`;

export const LocationBanner = styled.div<{ $type: 'neutral' | 'warning' | 'success' | 'error' }>`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 10px;
  color: #ffffff;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  background-color: ${({ $type }) => {
    if ($type === 'neutral') return 'rgba(28, 28, 30, 0.85)';
    if ($type === 'warning') return 'rgba(215, 120, 0, 0.9)';
    if ($type === 'success') return 'rgba(16, 185, 129, 0.9)';
    return 'rgba(255, 59, 48, 0.9)';
  }};
  cursor: ${({ $type }) => ($type === 'error' ? 'pointer' : 'default')};
`;

export const BannerText = styled.span`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.1px;
`;

export const BannerTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.1px;
`;

export const BannerSub = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 1px;
`;

export const SearchContainer = styled.div`
  position: absolute;
  top: 64px;
  left: 16px;
  right: 16px;
  z-index: 100;
  max-width: 440px;
  transition: all 0.25s ease;
  @media (min-width: 768px) { left: 24px; }
`;

export const SearchBarWrapper = styled.div<{ $isFocused?: boolean }>`
  background-color: #ffffff;
  border-radius: 16px;
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border: 1.5px solid ${({ $isFocused }) => ($isFocused ? '#10b981' : 'transparent')};
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0,0,0,0.02);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  .search-icon {
    font-size: 16px;
    margin-right: 10px;
    opacity: ${({ $isFocused }) => ($isFocused ? '1' : '0.6')};
    transition: opacity 0.2s;
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  color: #1c1c1e;
  font-size: 15px;
  font-weight: 600;
  background: transparent;
  &::placeholder { color: #8e8e93; font-weight: 500; }
`;

export const ClearInputButton = styled.button`
  background: rgba(0, 0, 0, 0.04);
  border: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba(0, 0, 0, 0.08); }
`;

export const SuggestionsMenu = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 18px;
  margin-top: 8px;
  padding: 8px 0;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-height: 280px;
  overflow-y: auto;
`;

export const SuggestionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover { background-color: rgba(0, 0, 0, 0.03); }
  &:last-child { border-bottom: none; }
`;

export const SuggestionLeft = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-right: 12px;
`;

export const SuggestionName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1c1c1e;
  letter-spacing: -0.1px;
`;

export const SuggestionCategory = styled.span`
  font-size: 11px;
  color: #8e8e93;
  font-weight: 600;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

export const SuggestionDist = styled.span`
  font-size: 12px;
  color: #10b981;
  font-weight: 700;
`;

export const LoaderContainer = styled.div`
  position: absolute;
  top: 132px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: 50px;
  gap: 10px;
  z-index: 80;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #ffffff;
    animation: spinRotate 0.8s linear infinite;
  }

  @keyframes spinRotate {
    to { transform: rotate(360deg); }
  }
`;

export const UIOverlayContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 90;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none; /* Keeps background map gestures interactive */

  & > * { pointer-events: auto; } /* Re-enables pointer tracks inside card modules */
`;

export const CarouselContainer = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 18px 0;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 440px;
`;

export const CarouselHeaderTitle = styled.h3`
  font-size: 11px;
  font-weight: 800;
  color: #1c1c1e;
  padding: 0 18px;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.8;
`;

export const CarouselScroll = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 18px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const PoiCard = styled.div`
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  padding: 14px;
  min-width: 180px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  
  &:hover { 
    transform: translateY(-2px); 
    background-color: #ffffff;
    box-shadow: 0 8px 16px rgba(0,0,0,0.05);
  }
`;

export const PoiCategory = styled.div`
  font-size: 9px;
  font-weight: 800;
  color: #8e8e93;
  margin-bottom: 4px;
  letter-spacing: 0.3px;
`;

export const PoiName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1c1c1e;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PoiAction = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const MyLocationFab = styled.button`
  position: absolute;
  right: 16px;
  bottom: 154px; /* Perfectly aligned to rest above the newly polished exploration carousel block */
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  color: #007aff;
  font-size: 22px;
  z-index: 95;
  transition: transform 0.2s, background-color 0.2s;

  &:hover {
    transform: scale(1.04);
    background-color: #f2f2f7;
  }
  
  &:active {
    transform: scale(0.96);
  }
`;


// Add this definition directly to the bottom of your MapScreenStyles.ts file:
export const ProjectionFab = styled.button<{ $is3D: boolean }>`
  position: absolute;
  top: 130px;
  right: 16px;
  background: ${({ $is3D }) => ($is3D ? "#10b981" : "rgba(255, 255, 255, 0.85)")};
  color: ${({ $is3D }) => ($is3D ? "#ffffff" : "#1c1c1e")};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  z-index: 110;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-1px);
    background: ${({ $is3D }) => ($is3D ? "#059669" : "#f2f2f7")};
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  @media(max-width: 768px) {
    top: auto;
    bottom: 154px; 
    right: auto;
    left: 16px; /* Positions perfectly opposite to the MyLocation Fab button layout on mobile */
  }
`;