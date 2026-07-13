// Directional org-to-org relationship: from = supplier side, to = buyer side.
// The inverse ("BUYS_FROM") is implied and never stored.
// Reserved for later (knowledge-graph driven): SUBSIDIARY_OF, SHARES_DIRECTOR_WITH.
export enum RelationshipTypeEnum {
  SUPPLIES_TO = 'SUPPLIES_TO',
}
