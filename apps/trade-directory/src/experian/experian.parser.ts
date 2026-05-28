import { XMLBuilder, XMLParser } from 'fast-xml-parser';

interface IXmlBuilder {
  build<T = any>(data: T): string;
}

interface IXmlParser {
  parse<T = any>(data: string): T;
}

const defaultXmlBuilderConfig = {
  format: true,
  processEntities: false,
};

const defaultXmlBuilder: IXmlBuilder = new XMLBuilder({
  ...defaultXmlBuilderConfig,
});

const defaultXmlParseConfig = {
  allowBooleanAttributes: true,
  ignoreAttributes: false,
  ignoreDeclaration: true,
};

const defaultXmlParser: IXmlParser = new XMLParser({
  ...defaultXmlParseConfig,
});

const ciAlwaysArray = [
  'xml.company_info.addresses.address',
  'xml.company_details.former_name.item',
  'xml.company_details.nature_businesses.nature_business',
  'xml.company_details.remark.item',
  'xml.directors.director',
  'xml.shareholders.shareholder.item',
  'xml.company_charges.company_charge',
  'xml.financial_statement.item',
  'xml.interests_in_other_company.item',
  'xml.legal_suit_by_regno.item',
  'xml.legal_suit_by_regno.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_by_regno.item.claim_details.claim_detail',
  'xml.legal_suit_by_regno.item.suit_remark.item',
  'xml.legal_suit_by_regno.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_proclamation_by_regno.CWS.item',
  'xml.legal_suit_proclamation_by_regno.CWS.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_proclamation_by_regno.CWS.item.claim_details.claim_detail',
  'xml.legal_suit_proclamation_by_regno.CWS.item.suit_remark.item',
  'xml.legal_suit_proclamation_by_regno.CWS.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_proclamation_by_regno.high_court.item',
  'xml.legal_suit_proclamation_by_regno.high_court.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_proclamation_by_regno.high_court.item.claim_details.claim_detail',
  'xml.legal_suit_proclamation_by_regno.high_court.item.suit_remark.item',
  'xml.legal_suit_proclamation_by_regno.high_court.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_proclamation_by_regno.land_office.item',
  'xml.legal_suit_proclamation_by_regno.land_office.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_proclamation_by_regno.land_office.item.claim_details.claim_detail',
  'xml.legal_suit_proclamation_by_regno.land_office.item.suit_remark.item',
  'xml.legal_suit_proclamation_by_regno.land_office.item.other_defendant_details.other_defendant_detail',
  'xml.others_known_legal_suit.item',
  'xml.others_known_legal_suit.item.plaintiff_details.plaintiff_detail',
  'xml.others_known_legal_suit.item.claim_details.claim_detail',
  'xml.others_known_legal_suit.item.suit_remark.item',
  'xml.others_known_legal_suit.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_by_plaintiff.item',
  'xml.legal_suit_by_plaintiff.item.defendant_details.defendant_detail',
  'xml.legal_suit_by_plaintiff.item.claim_details.claim_detail',
  'xml.legal_suit_by_plaintiff.item.suit_remark.item',
  'xml.windup_petition_details.windup_petition_detail',
  'xml.windup_petition_details.windup_petition_detail.former_name_details.former_name_detail',
  'xml.windup_petition_details.windup_petition_detail.windup_remark.item',
  'xml.trade_bureau_entity_details.tb_credit_reference.item',
  'xml.trade_bureau_entity_details.tb_payment.payment_profile.item',
  'xml.trade_bureau_entity_details.tb_payment.payment_profile.item.invoice.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.month.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.capacity.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.acc_status.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.lender_type.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.facility.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.repayment_term.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.collateral_type.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.status.item',
  'xml.aml_sanction_list.amlSanctionList.item',
  'xml.previous_enquiry.finance.item',
  'xml.previous_enquiry.finance.item.month.item',
  'xml.previous_enquiry.commercial.item',
  'xml.previous_enquiry.commercial.item.month.item',
];

const ciXmlParser: IXmlParser = new XMLParser({
  ...defaultXmlParseConfig,
  isArray: (_, jPath) => {
    return ciAlwaysArray.indexOf(jPath) !== -1;
  },
});

const biAlwaysArray = [
  'xml.company_info.addresses.address',
  'xml.company_info.addresses.address.address.date_capture',
  'xml.business_details.former_name.item',
  'xml.business_details.business_activity.item',
  'xml.business_details.branch.item',
  'xml.business_details.remark.item',
  'xml.owner.item',
  'xml.legal_suit_by_regno.item',
  'xml.legal_suit_by_regno.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_by_regno.item.claim_details.claim_detail',
  'xml.legal_suit_by_regno.item.suit_remark.item',
  'xml.legal_suit_by_regno.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_proclamation_by_regno.CWS.item',
  'xml.legal_suit_proclamation_by_regno.CWS.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_proclamation_by_regno.CWS.item.claim_details.claim_detail',
  'xml.legal_suit_proclamation_by_regno.CWS.item.suit_remark.item',
  'xml.legal_suit_proclamation_by_regno.CWS.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_proclamation_by_regno.high_court.item',
  'xml.legal_suit_proclamation_by_regno.high_court.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_proclamation_by_regno.high_court.item.claim_details.claim_detail',
  'xml.legal_suit_proclamation_by_regno.high_court.item.suit_remark.item',
  'xml.legal_suit_proclamation_by_regno.high_court.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_proclamation_by_regno.land_office.item',
  'xml.legal_suit_proclamation_by_regno.land_office.item.plaintiff_details.plaintiff_detail',
  'xml.legal_suit_proclamation_by_regno.land_office.item.claim_details.claim_detail',
  'xml.legal_suit_proclamation_by_regno.land_office.item.suit_remark.item',
  'xml.legal_suit_proclamation_by_regno.land_office.item.other_defendant_details.other_defendant_detail',
  'xml.others_known_legal_suit.item',
  'xml.others_known_legal_suit.item.plaintiff_details.plaintiff_detail',
  'xml.others_known_legal_suit.item.claim_details.claim_detail',
  'xml.others_known_legal_suit.item.suit_remark.item',
  'xml.others_known_legal_suit.item.other_defendant_details.other_defendant_detail',
  'xml.legal_suit_by_plaintiff.item',
  'xml.legal_suit_by_plaintiff.item.defendant_details.defendant_detail',
  'xml.legal_suit_by_plaintiff.item.claim_details.claim_detail',
  'xml.legal_suit_by_plaintiff.item.suit_remark.item',
  'xml.trade_bureau_entity_details.tb_credit_reference.item',
  'xml.trade_bureau_entity_details.tb_credit_reference.item.guarantor_details.guarantor_detail',
  'xml.trade_bureau_entity_details.tb_payment.payment_profile.item',
  'xml.trade_bureau_entity_details.tb_payment.payment_profile.item.invoice.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.month.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.capacity.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.acc_status.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.lender_type.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.facility.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.repayment_term.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.collateral_type.item',
  'xml.trade_bureau_entity_details.tb_payment.p2p_fintech.legend.status.item',
  'xml.aml_sanction_list.amlSanctionList.item',
  'xml.previous_enquiry.finance.item',
  'xml.previous_enquiry.finance.item.month.item',
  'xml.previous_enquiry.commercial.item',
  'xml.previous_enquiry.commercial.item.month.item',
];

const biXmlParser: IXmlParser = new XMLParser({
  ...defaultXmlParseConfig,
  isArray: (_, jPath) => {
    return biAlwaysArray.indexOf(jPath) !== -1;
  },
});

export {
  IXmlBuilder,
  IXmlParser,
  defaultXmlBuilder,
  defaultXmlParser,
  ciXmlParser,
  biXmlParser,
};
