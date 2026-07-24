// Maker-checker lifecycle (CRC pass 1): DRAFT -> PENDING_CHECK -> CHECKED ->
// PUBLISHED / ARCHIVED. Only DRAFT is editable; published models are
// immutable (duplicate-existing to modify).
export enum RiskModelStatusEnum {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
  PENDING_CHECK = 'PENDING_CHECK',
  CHECKED = 'CHECKED',
}

export enum RiskModelShapeEnum {
  SIMPLE_WEIGHTED = 'SIMPLE_WEIGHTED',
  MULTI_FACTOR = 'MULTI_FACTOR',
}
