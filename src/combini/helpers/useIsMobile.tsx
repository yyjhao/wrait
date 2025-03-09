import { useMediaQuery } from "./useMediaQuery";

export const useIsMobile = (): boolean => {
  return useMediaQuery("(max-width: 767px)");
};
