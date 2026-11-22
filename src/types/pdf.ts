export type ToolType =
  | 'select'
  | 'editText'
  | 'text'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'redact'
  | 'signature'
  | 'image'
  | 'stamp';

export interface Point {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  pageIndex: number; // 0-based
  x: number; // in PDF points (72 DPI)
  y: number; // in PDF points
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier';
  color: string;
  bold?: boolean;
  italic?: boolean;
  backgroundColor?: string;
  // If replacing existing original text in the PDF
  isReplacement?: boolean;
  originalText?: string;
  coverWidth?: number;
  coverHeight?: number;
}

export interface DrawingAnnotation extends BaseAnnotation {
  type: 'draw' | 'highlight';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  isHighlighter?: boolean;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'circle' | 'line' | 'arrow';
  fillColor?: string;
  strokeColor: string;
  strokeWidth: number;
  endPoint?: Point; // for lines/arrows
}

export interface RedactAnnotation extends BaseAnnotation {
  type: 'redact';
  color: string; // usually #000000 or #FFFFFF
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image' | 'signature';
  dataUrl: string; // PNG or JPEG data URL
  aspectRatio: number;
}

export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  stampType: 'approved' | 'confidential' | 'urgent' | 'draft' | 'checkmark' | 'cross';
  color: string;
  label?: string;
}

export type Annotation =
  | TextAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | RedactAnnotation
  | ImageAnnotation
  | StampAnnotation;

export interface PageInfo {
  pageIndex: number;
  originalIndex: number;
  width: number; // points (72 dpi)
  height: number;
  rotation: number; // 0, 90, 180, 270
  isBlank?: boolean; // inserted blank page (no source content)
}

export interface DocumentState {
  file: File | null;
  fileName: string;
  arrayBuffer: ArrayBuffer | null;
  numPages: number;
  pages: PageInfo[];
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  activePageIndex: number;
  scale: number;
  activeTool: ToolType;
  toolSettings: ToolSettings;
}

export interface ToolSettings {
  color: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier';
  fillColor: string;
  opacity: number;
  stampType: StampAnnotation['stampType'];
}

export interface HistoryStep {
  annotations: Annotation[];
  pages: PageInfo[];
}
