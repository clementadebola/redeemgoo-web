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
`;

export const BannerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
`;

export const LocationBanner = styled.div<{ $type: 'neutral' | 'warning' | 'success' | 'error' }>`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 8px;
  color: #ffffff;
  background-color: ${({ $type }) => {
    if ($type === 'neutral') return 'rgba(28, 28, 30, 0.9)';
    if ($type === 'warning') return 'rgba(215, 120, 0, 0.95)';
    if ($type === 'success') return 'rgba(16, 185, 129, 0.92)';
    return 'rgba(255, 59, 48, 0.92)';
  }};
  cursor: ${({ $type }) => ($type === 'error' ? 'pointer' : 'default')};
`;

export const BannerText = styled.span`
  font-size: 13px;
  font-weight: 600;
`;

export const BannerTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
`;

export const BannerSub = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 1px;
`;

export const SearchContainer = styled.div`
  position: absolute;
  top: 60px;
  left: 16px;
  right: 16px;
  z-index: 10;
  max-width: 480px;
  @media (min-width: 768px) { left: 24px; }
`;

export const SearchBarWrapper = styled.div`
  background-color: #ffffff;
  border-radius: 14px;
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  color: #1c1c1e;
  font-size: 15px;
  font-weight: 500;
  &::placeholder { color: #8e8e93; }
`;

export const ClearInputButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  margin-left: 8px;
  color: #8e8e93;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

export const SuggestionsMenu = styled.div`
  background-color: #ffffff;
  border-radius: 14px;
  margin-top: 8px;
  padding: 6px 0;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  max-height: 260px;
  overflow-y: auto;
`;

export const SuggestionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 0.5px solid #e5e5ea;
  cursor: pointer;
  &:hover { background-color: #f2f2f7; }
  &:last-child { border-bottom: none; }
`;

export const SuggestionLeft = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-right: 8px;
`;

export const SuggestionName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1c1c1e;
`;

export const SuggestionCategory = styled.span`
  font-size: 11px;
  color: #8e8e93;
  margin-top: 2px;
`;

export const SuggestionDist = styled.span`
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
`;

export const LoaderContainer = styled.div`
  position: absolute;
  top: 125px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(28, 28, 30, 0.9);
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 20px;
  gap: 8px;
  z-index: 5;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
`;

export const UIOverlayContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  padding-bottom: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const CarouselContainer = styled.div`
  background-color: #ffffff;
  border-radius: 20px;
  padding: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
`;

export const CarouselHeaderTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  color: #1c1c1e;
  padding: 0 16px;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const CarouselScroll = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 16px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const PoiCard = styled.div`
  background-color: #f2f2f7;
  border-radius: 12px;
  padding: 14px;
  min-width: 170px;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.1s ease;
  &:hover { transform: scale(1.02); }
`;

export const PoiCategory = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: #8e8e93;
  margin-bottom: 2px;
`;

export const PoiName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #757579;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PoiAction = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
`;

export const HudCard = styled.div`
  background-color: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
`;

export const HudLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: #10b981;
  letter-spacing: 1.2px;
`;

export const HudTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1c1c1e;
  margin: 2px 0 14px 0;
`;

export const HudMetricsRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  background-color: #f2f2f7;
  border-radius: 12px;
  padding: 12px;
`;

export const HudMetricBlock = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const HudMetricLabel = styled.span`
  font-size: 10px;
  color: #8e8e93;
  font-weight: 600;
  margin-bottom: 2px;
`;

export const HudMetricValue = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #1c1c1e;
`;

export const HudDivider = styled.div`
  width: 1px;
  height: 28px;
  background-color: #d1d1d6;
`;

export const CancelButton = styled.button`
  width: 100%;
  background-color: #ff3b30;
  border: none;
  border-radius: 12px;
  padding: 13px 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

export const MyLocationFab = styled.button`
  position: absolute;
  right: 16px;
  bottom: 210px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  color: #007aff;
  font-size: 20px;
  z-index: 10;
`;