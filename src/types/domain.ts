export interface FigmaSectionInfo {
  id: string;
  name: string;
}

export interface FigmaComponentInfo {
  id: string;
  name: string;
}

/** Absolute position coordinates. Applies only in ABSOLUTE positioning mode. */
export interface Position {
  x: number;
  y: number;
}

/** MVP: only 'simple' (1, 2, 3). Extensible in v2. */
export type PagingFormat = 'simple';

export interface PageStampMold {
  sectionId: string;
  /** ID of the file component to use. Ignored when useDefaultComponent is true. */
  componentId: string;
  /** Whether to auto-create the default PageNumber / Default component. */
  useDefaultComponent: boolean;
  /** Name of the text layer inside the component. Default: '{page_number}' */
  textLayerName: string;
  positioningMode: 'ABSOLUTE' | 'AUTO_LAYOUT';
  /** Applies only in ABSOLUTE mode. */
  position: Position;
  pagingFormat: PagingFormat;
  startNumber: number;
}
