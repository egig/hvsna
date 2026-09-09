export interface NavbarProps {
  title?: string | React.ReactNode;
  /** Small kicker line rendered above the title (e.g. the Hijri date). */
  eyebrow?: string | React.ReactNode;
  showBackButton?: boolean;
  customBackAction?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  modal?: boolean;
  onModalClose?: () => void;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}
