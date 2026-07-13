import { Badge, Button, Divider, Loader, Table, Tabs } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBuilding,
  IconClipboardText,
  IconChartPie,
  IconCash,
  IconUserScan,
  IconChevronLeft,
  IconPhoto,
  IconMessageCircle,
} from '@tabler/icons-react';
import axios, { AxiosResponse } from 'axios';
import MantineTable from 'components/Table/MantineTable';
import { businessSectors } from 'constants/businessSector';
import { color } from 'constants/color';
import { companyType } from 'constants/companyType';
import { BASE_URL } from 'constants/constant';
import { countries } from 'constants/countries';
import { ADMIN } from 'constants/routes';
import { MRT_ColumnDef, MRT_Row } from 'mantine-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import RiskFilters from './Tabs/Risk/RiskFilters';

const OrganizationView = () => {
  const { organizationId } = useParams(); // Extract the ID from the URL
  const [organizationData, setOrganizationData] = useState<any>(null); // Initialize as null
  const [loading, setLoading] = useState<boolean>(true); // Add loading state

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true); // Start loading

        // Simulate API delay with setTimeout
        const response: AxiosResponse = await new Promise((resolve, reject) => {
          setTimeout(() => {
            axios
              .get(
                `${BASE_URL}/trade-directory/api/organizations/${organizationId}?includeApplications=true&includeKycAgencyReports=true`
              )
              .then(resolve)
              .catch(reject);
          }, 300); // 300ms delay
        });

        const fetchedOrganizationData = response.data;

        console.log(
          '🚀 ~ fetchedOrganizationData ~ :',
          fetchedOrganizationData
        );

        setOrganizationData(fetchedOrganizationData.data); // Update state with fetched data
      } catch (error) {
        console.error(
          `Error fetching organization data for ID: ${organizationId}:`,
          error
        );

        // Show error notification (with "once" to prevent duplication)
        notifications.show({
          id: 'fetch-error', // Unique ID to ensure it displays only once
          title: 'Error',
          message: 'Failed to fetched organization data',
          color: 'red',
          autoClose: 2000,
        });
      } finally {
        setLoading(false); // Stop loading
      }
    };

    if (organizationId) fetchOrganization();
  }, [organizationId]); // Dependency ensures this effect runs only when organizationId changes.

  const processedData = useMemo(() => {
    if (!organizationData || !organizationData.organizationPersons) return [];
    return organizationData.organizationPersons.map((item: any) => ({
      name: item.person?.name
        ? item.person.name
            .toLowerCase()
            .replace(/\b\w/g, (char: string) => char.toUpperCase())
        : '-',
      designation: item.designation
        ? item.designation
            .toLowerCase()
            .replace(/\b\w/g, (char: string) => char.toUpperCase())
        : '-',
      email: item.person?.email || '-', // Email remains unchanged
      mobileNumber: item.person?.mobileNumber || '-', // Mobile number remains unchanged
      address: item.person?.residentialAddress
        ? item.person.residentialAddress
            .toLowerCase()
            .replace(/\b\w/g, (char: string) => char.toUpperCase())
        : '-',
    }));
  }, [organizationData]);

  // Memoized columns to ensure the hook order remains consistent.
  // React Hooks must always execute in the same order during renders.
  const columns: MRT_ColumnDef<any>[] = useMemo(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 250,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '12px',
            color: 'gray',
          },
        },
      },
      {
        accessorKey: 'designation',
        header: 'Designation',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '12px',
            color: 'gray',
          },
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '12px',
            color: 'gray',
          },
        },
      },
      {
        accessorKey: 'mobileNumber',
        header: 'Contact Number',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '12px',
            color: 'gray',
          },
        },
      },
      {
        accessorKey: 'address',
        header: 'Address',
        size: 300,
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase',
            fontSize: '12px',
            color: 'gray',
          },
        },
      },
    ];
  }, []); // Memoize to prevent unnecessary re-renders of columns.

  // Loader for API delay
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={30} color={color.GRAPE} />
      </div>
    );
  }

  if (!organizationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No data available for this organization.</p>
      </div>
    );
  }

  // Map persona to badge color
  const personaBadgeColors: { [key: string]: string } = {
    BORROWER: 'blue',
    SUPPLIER: 'green',
    INVESTOR: 'yellow',
  };

  const organizationTypeDisplayName =
    companyType.find((type) => type.code === organizationData.organizationType)
      ?.name || '-';

  const businessSectorDisplayName =
    businessSectors.find(
      (type) => type.code === organizationData.organizationBusinessSector
    )?.name || '-';

  const countryDisplayName =
    countries.find((type) => type.code === organizationData.country)?.name ||
    '-';

  const profileData = [
    {
      header: 'Organization Name :',
      value: organizationData.organizationName
        ? organizationData.organizationName
            .toLowerCase()
            .replace(/\b\w/g, (char: string) => char.toUpperCase())
        : '-',
    },
    {
      header: 'Business Registration No. :',
      value: organizationData.businessRegistrationNumber || '-',
    },
    { header: 'Country :', value: countryDisplayName },
    { header: 'Organization Type :', value: organizationTypeDisplayName },
    {
      header: 'Business Sector :',
      value: businessSectorDisplayName,
    },
    { header: 'Email Address :', value: organizationData.emailAddress || '-' },
    {
      header: 'Contact Number :',
      value: organizationData.contactNumber || '-',
    },
    {
      header: 'Company Website :',
      value: organizationData.organizationWebsite || '-',
    },
    {
      header: 'Registered Address :',
      value: organizationData.registeredAddress || '-',
    },
    { header: 'Postcode :', value: organizationData.postcode || '-' },
    {
      header: 'Year Established :',
      value: organizationData.yearEstablished || '-',
    },
    { header: 'Company Size :', value: organizationData.companySize || '-' },
    {
      header: 'Revenue :',
      value: organizationData.revenueAmount
        ? `${organizationData.revenueAmount} ${
            organizationData.revenueCurrency || ''
          }`
        : '-',
    },
    {
      header: 'Tax Identification Number (TIN) :',
      value: organizationData.taxIdentificationNumber || '-',
    },
  ];

  const profileTableRows = profileData.map((element) => (
    <Table.Tr key={element.header}>
      <Table.Td
        style={{
          width: '200px',
          fontWeight: 'bold',
          textAlign: 'start',
          verticalAlign: 'top',
        }}
      >
        {element.header}
      </Table.Td>
      <Table.Td
        style={{
          textAlign: 'start',
          verticalAlign: 'top',
        }}
      >
        {element.value}
      </Table.Td>
    </Table.Tr>
  ));

  const KycReportTabs = ({
    kycAgencyReports,
  }: {
    kycAgencyReports: any[];
  }) => {
    if (!kycAgencyReports || kycAgencyReports.length === 0) {
      return <p className="text-xs">No KYC agency reports available.</p>;
    }

    return (
      <Tabs defaultValue={kycAgencyReports[0]?.reportType} variant="outline">
        <Tabs.List>
          {kycAgencyReports.map((report) => (
            <Tabs.Tab
              key={report.id}
              value={report.reportType}
              style={{ fontSize: '12px' }}
            >
              {report.reportType}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {kycAgencyReports.map((report) => {
          const lastFinancialFiledDate = report.lastFinancialFiled
            ? new Date(report.lastFinancialFiled)
                .toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                .toUpperCase()
            : 'N/A';

          const profileTableRows = [
            { header: 'Company Name :', value: report.companyName },
            {
              header: 'Registration No. :',
              value: report.registrationNumber,
            },
            { header: 'Status : ', value: report.status },
            { header: 'Type : ', value: report.type },
            {
              header: 'Incorporation Date :',
              value: new Date(report.incorporationDate).toLocaleDateString(),
            },
            {
              header: 'Business Address :',
              value: report.businessAddress,
            },
            {
              header: 'Registered Address :',
              value:
                report.registeredAddress
                  ?.map((addr: { address: any }) => addr.address)
                  .join(', ') || '-',
            },
            { header: 'Business Sector :', value: report.businessSector },
            {
              header: 'Nature of Business :',
              value: report.natureOfBusiness,
            },
            {
              header: 'Business Constitution :',
              value: report.businessConstitution,
            },
            {
              header: 'Principal Activity :',
              value: report.principalActivity,
            },
            {
              header: 'Last Financial Filed :',
              value: report.lastFinancialFiled ? lastFinancialFiledDate : '-',
            },
          ];

          const managementDetailsTableRows: {
            name: string;
            identificationNumber: string;
            designation: string;
            address: string;
            appointmentDate: string;
          }[] =
            report.managementDetails?.map((manager: any) => ({
              name: manager.name || '-',
              identificationNumber: manager.localNumber || '-',
              designation: manager.designation || '-',
              address: manager.address || '-',
              appointmentDate: manager.appointmentDate
                ? new Date(manager.appointmentDate).toLocaleDateString()
                : '-',
            })) || [];

          const shareholdersTableRows: {
            name: string;
            identificationNumber: string;
            address: string;
            shareholding: string;
            shareholdingPercentage: string;
          }[] =
            report.shareholders?.map((shareholder: any) => ({
              name: shareholder.name || '-',
              identificationNumber: shareholder.localNumber || '-',
              address: shareholder.address || '-',
              shareholding: shareholder.shareholding || '-',
              shareholdingPercentage: shareholder.shareholdingPercentage || '-',
            })) || [];

          const financialStatementData = [
            {
              header: 'Non Current Assets :',
              value: report.nonCurrentAssets?.toLocaleString('en-US'),
            },
            {
              header: 'Current Assets :',
              value: report.currentAssets?.toLocaleString('en-US'),
            },
            {
              header: 'Total Assets :',
              value: report.totalAssets?.toLocaleString('en-US'),
            },
            {
              header: 'Accumulated Profit Carried Forward :',
              value:
                report.accumulatedProfitCarriedForward?.toLocaleString('en-US'),
            },
            {
              header: 'Total Equity :',
              value: report.totalEquity?.toLocaleString('en-US'),
            },
            {
              header: 'Non Current Liabilities :',
              value: report.nonCurrentLiabilities?.toLocaleString('en-US'),
            },
            {
              header: 'Current Liabilities :',
              value: report.currentLiabilities?.toLocaleString('en-US'),
            },
            {
              header: 'Total Liabilities :',
              value: report.totalLiabilities?.toLocaleString('en-US'),
            },
            {
              header: 'Total Equity and Liabilities :',
              value: report.totalEquityAndLiabilities?.toLocaleString('en-US'),
            },
            {
              header: 'Revenue :',
              value: report.revenue?.toLocaleString('en-US'),
            },
            {
              header: 'Profit Before Tax :',
              value: report.profitBeforeTax?.toLocaleString('en-US'),
            },
            {
              header: 'Profit After Tax :',
              value: report.profitAfterTax?.toLocaleString('en-US'),
            },
            {
              header: 'Current Ratio :',
              value: report.currentRatio,
            },
          ];

          const companyChargesTableRows: {
            chargeNumber: string;
            chargeStatus: string;
            nameOfChargee: string;
            totalOfCharge: string;
            dateOfCreation: string;
          }[] =
            report.companyCharges?.map((companyCharge: any) => ({
              chargeNumber: companyCharge.chargeNumber || '-',
              chargeStatus: companyCharge.chargeStatus || '-',
              nameOfChargee: companyCharge.nameOfChargee || '-',
              totalOfCharge: companyCharge.totalOfCharge || '-',
              dateOfCreation: companyCharge.dateOfCreation || '-',
            })) || [];

          const interestInOtherCompanyTableRows: {
            localNo: string;
            company: string;
            shareholding: string;
            shareholdingPercentage: string;
            remark: string;
            asAt: string;
          }[] =
            report.interestInOtherCompanies?.map(
              (interestInOtherCompany: any) => ({
                localNo: interestInOtherCompany.localNo || '-',
                company: interestInOtherCompany.company || '-',
                shareholding: interestInOtherCompany.shareholding || '-',
                shareholdingPercentage:
                  interestInOtherCompany.shareholdingPercentage || '-',
                remark: interestInOtherCompany.remark || '-',
                asAt: interestInOtherCompany.asAt || '-',
              })
            ) || [];

          const legalSuitsSubjectAsDefendantTableRows: {
            suitRef: string;
            caseStatus: string;
            hearingDate: string;
            defendantName: string;
            plaintiffName: string;
            defendantLocalNumber: string;
          }[] =
            report.legalSuitsSubjectAsDefendant?.map((legalSuit: any) => ({
              suitRef: legalSuit.suitRef || '-',
              caseStatus: legalSuit.caseStatus || '-',
              hearingDate: legalSuit.hearingDate || '-',
              defendantName: legalSuit.defendantName || '-',
              plaintiffName: legalSuit.plaintiffName || '-',
              defendantLocalNumber: legalSuit.defendantLocalNumber || '-',
            })) || [];

          const legalSuitsSubjectAsPlaintiffTableRows: {
            suitRef: string;
            caseStatus: string;
            hearingDate: string;
            plaintiffName: string;
            plaintiffLocalNumber: string;
          }[] =
            report.legalSuitsSubjectAsPlaintiff?.map((legalSuit: any) => ({
              suitRef: legalSuit.suitRef || '-',
              caseStatus: legalSuit.caseStatus || '-',
              hearingDate: legalSuit.hearingDate || '-',
              plaintiffName: legalSuit.plaintiffName || '-',
              plaintiffLocalNumber: legalSuit.plaintiffLocalNumber || '-',
            })) || [];

          const windingUpActionSubjectAsDefendantTableRows: {
            courtType: string;
            caseNumber: string;
            defendantName: string;
            solicitorAddress: string;
            defendantLocalNumber: string;
          }[] =
            report.windingUpActionSubjectAsDefendant?.map((legalSuit: any) => ({
              courtType: legalSuit.courtType || '-',
              caseNumber: legalSuit.caseNumber || '-',
              defendantName: legalSuit.defendantName || '-',
              solicitorAddress: legalSuit.solicitorAddress || '-',
              defendantLocalNumber: legalSuit.defendantLocalNumber || '-',
            })) || [];

          const windingUpActionSubjectAsPetitionerTableRows: {
            courtType: string;
            caseNumber: string;
            defendantName: string;
            petitionerName: string;
            solicitorAddress: string;
            defendantLocalNumber: string;
            petitionerLocalNumber: string;
          }[] =
            report.windingUpActionSubjectAsPetitioner?.map(
              (legalSuit: any) => ({
                courtType: legalSuit.courtType || '-',
                caseNumber: legalSuit.caseNumber || '-',
                defendantName: legalSuit.defendantName || '-',
                petitionerName: legalSuit.petitionerName || '-',
                solicitorAddress: legalSuit.solicitorAddress || '-',
                defendantLocalNumber: legalSuit.defendantLocalNumber || '-',
                petitionerLocalNumber: legalSuit.petitionerLocalNumber || '-',
              })
            ) || [];

          const creditScoreTableRows = [
            { header: 'iScore :', value: report.iScore },
          ];

          // This is to convert the object key into camelCase since current object key for summaryCreditInformation{} has spaces
          const toCamelCase = (str: string) =>
            str
              .replace(/[^a-zA-Z0-9 ]/g, '') // Remove special characters
              .replace(
                /(?:^\w|[A-Z]|\b\w|\s+)/g,
                (match: string, index: number) =>
                  index === 0 ? match.toLowerCase() : match.toUpperCase()
              )
              .replace(/\s+/g, ''); // Remove spaces

          const transformKeysToCamelCase = (obj: string) =>
            Object.fromEntries(
              Object.entries(obj).map(([key, value]) => [
                toCamelCase(key),
                value,
              ])
            );

          const transformedSummary = report.summaryCreditInformation
            ? transformKeysToCamelCase(report.summaryCreditInformation)
            : {};

          const summaryCreditInformationTableRows = [
            {
              header: 'Legal Suits :',
              value: transformedSummary.legalSuits || '-',
            },
            {
              header: 'Winding Up Record :',
              value: transformedSummary.windingUpRecord || '-',
            },
            {
              header: 'Trade / Credit Reference :',
              value: transformedSummary.tradeCreditReference || '-',
            },
            {
              header: 'Special Attention Account :',
              value: transformedSummary.specialAttentionAccount || '-',
            },
            {
              header: 'Credit Applications Pending :',
              value: transformedSummary.creditApplicationsPending || '-',
            },
            {
              header: 'Legal Action taken (from Banking) :',
              value: transformedSummary.legalActionTakenFromBanking || '-',
            },
            {
              header: 'Total Enquiries for Last 12 months :',
              value: transformedSummary.totalEnquiriesForLast12Months || '-',
            },
            {
              header: 'Total Companies/Businesses Interest :',
              value: transformedSummary.totalCompaniesBusinessesInterest || '-',
            },
            {
              header: 'Existing No. of Facility (from Banking) :',
              value: transformedSummary.existingNoOfFacilityFromBanking || '-',
            },
            {
              header: 'Credit Applications Approved for Last 12 months :',
              value:
                transformedSummary.creditApplicationsApprovedForLast12Months ||
                '-',
            },
          ];

          type ConductOfAccount = {
            month: string;
            year: string;
            value: string;
          };

          type DetailedCreditReport = {
            colType: string;
            facility: string;
            dateBalanceUpdated: string;
            printRepaymentTerm: string;
            limitInstallmentAmount: string;
            totalOutstandingBalance: string;
            conductOfAccount: ConductOfAccount[];
          };

          const detailedCreditReportTableRows: DetailedCreditReport[] =
            report.detailedCreditReport?.map(
              (creditReport: {
                colType?: string;
                facility?: string;
                dateBalanceUpdated?: string;
                printRepaymentTerm?: string;
                limitInstallmentAmount?: number;
                totalOutstandingBalance?: number;
                conductOfAccount?: {
                  [year: string]: { [month: string]: string };
                };
              }) => {
                // Extract basic fields
                const basicFields = {
                  colType: creditReport.colType || '-',
                  facility: creditReport.facility || '-',
                  dateBalanceUpdated: creditReport.dateBalanceUpdated
                    ? new Date(
                        creditReport.dateBalanceUpdated
                      ).toLocaleDateString()
                    : '-',
                  printRepaymentTerm: creditReport.printRepaymentTerm || '-',
                  limitInstallmentAmount: creditReport.limitInstallmentAmount
                    ? creditReport.limitInstallmentAmount.toLocaleString()
                    : '-',
                  totalOutstandingBalance: creditReport.totalOutstandingBalance
                    ? creditReport.totalOutstandingBalance.toLocaleString()
                    : '-',
                };

                // Extract and sort Conduct of Account
                let conductOfAccount: {
                  year: string;
                  month: string;
                  value: string;
                }[] = [];
                Object.entries(creditReport.conductOfAccount || {}).forEach(
                  ([year, months]) => {
                    Object.entries(months).forEach(([month, value]) => {
                      const shortMonth = new Date(
                        `${month} 1, 2023`
                      ).toLocaleString('en-US', {
                        month: 'short',
                      });
                      conductOfAccount.push({
                        year,
                        month: shortMonth,
                        value: value || '-',
                      });
                    });
                  }
                );

                // Sort by year descending, then month descending
                conductOfAccount = conductOfAccount.sort((a, b) => {
                  const yearDiff = parseInt(b.year, 10) - parseInt(a.year, 10);
                  if (yearDiff !== 0) return yearDiff;

                  const monthA = new Date(`${a.month} 1, 2023`).getMonth();
                  const monthB = new Date(`${b.month} 1, 2023`).getMonth();
                  return monthB - monthA; // Descending by month
                });

                return {
                  ...basicFields,
                  conductOfAccount,
                };
              }
            ) || [];

          const conductOfAccountData = detailedCreditReportTableRows.flatMap(
            (row) =>
              row.conductOfAccount.map((entry) => ({
                year: entry.year,
                month: entry.month,
                value: entry.value,
              }))
          );

          // Extract unique years sorted in descending order
          const years = Array.from(
            new Set(conductOfAccountData.map((entry) => entry.year))
          ).sort((a, b) => parseInt(b) - parseInt(a));

          // Extract unique months for each year and sort them dynamically
          const monthsByYear = years.reduce(
            (acc: Record<string, string[]>, year) => {
              acc[year] = Array.from(
                new Set(
                  conductOfAccountData
                    .filter((entry) => entry.year === year)
                    .map((entry) => entry.month)
                )
              ).sort(
                (a, b) =>
                  new Date(`1 ${b} 2023`).getMonth() -
                  new Date(`1 ${a} 2023`).getMonth()
              ); // Sort months in descending order
              return acc;
            },
            {}
          );

          const facilitiesInformationTableRows = [
            {
              header: 'Latest Approved Facilities :',
              value: report.latestThreeApprovedFacilities,
            },
            { header: 'Secured Facilities :', value: report.securedFacilities },
            {
              header: 'Unsecured Facilities :',
              value: report.unsecuredFacilities,
            },
          ];

          const creditFacilitiesInformationTableRows = [
            { header: 'Credit Card :', value: report.creditCard },
            {
              header: 'Other Revolving Credits :',
              value: report.otherRevolvingCredits,
            },
            { header: 'Charge Card :', value: report.chargeCard },
          ];

          const financingTableRows = [
            {
              header: 'National Higher Education Financing :',
              value: report.nationalHigherEducationFinancing,
            },
          ];

          const lendersInformationTableRows = [
            { header: 'Local Lenders :', value: report.localLenders },
            { header: 'Foreign Lenders :', value: report.foreignLenders },
          ];

          return (
            <Tabs.Panel key={report.id} value={report.reportType}>
              <div className="pt-6">
                <Table
                  withRowBorders={false}
                  style={{
                    fontSize: '12px',
                  }}
                >
                  <Table.Tbody>
                    {profileTableRows.map((row, index) => (
                      <Table.Tr key={index}>
                        <Table.Td
                          style={{
                            fontWeight: 'bold',
                            textAlign: 'left',
                            verticalAlign: 'top',
                            width: '200px',
                          }}
                        >
                          {row.header}
                        </Table.Td>
                        <Table.Td
                          style={{ textAlign: 'left', verticalAlign: 'top' }}
                        >
                          {row.value || '-'}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
              <div>
                <Divider my="sm" />
              </div>
              {/* Summary of Share Capital Table */}
              <div className="py-3">
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  SUMMARY OF SHARE CAPITAL
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Total Issued (RM)</Table.Th>
                        <Table.Th>Cash</Table.Th>
                        <Table.Th>Other Than Cash</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>
                          {' '}
                          {report.shareCapitalTotalIssued
                            ? report.shareCapitalTotalIssued.toLocaleString()
                            : '-'}
                        </Table.Td>
                        <Table.Td>
                          {report.shareCapitalCash
                            ? report.shareCapitalCash.toLocaleString()
                            : '-'}
                        </Table.Td>
                        <Table.Td>
                          {report.shareCapitalOtherwiseThanCash}
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div>
                <Divider my="sm" />
              </div>
              {/* Management Details Table */}
              <div className="py-3">
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  MANAGEMENT DETAILS
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Identification No.</Table.Th>
                        <Table.Th>Designation</Table.Th>
                        <Table.Th>Address</Table.Th>
                        <Table.Th>Appointment Date</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {managementDetailsTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>{row.name}</Table.Td>
                          <Table.Td>{row.identificationNumber}</Table.Td>
                          <Table.Td>{row.designation}</Table.Td>
                          <Table.Td>{row.address}</Table.Td>
                          <Table.Td>{row.appointmentDate}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Shareholders Details Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  SHAREHOLDERS
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Identification No.</Table.Th>
                        <Table.Th>Address</Table.Th>
                        <Table.Th>Shareholding</Table.Th>
                        <Table.Th>Shareholding Percentage (%)</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {shareholdersTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>{row.name}</Table.Td>
                          <Table.Td>{row.identificationNumber}</Table.Td>
                          <Table.Td>{row.address}</Table.Td>
                          <Table.Td>{row.shareholding}</Table.Td>
                          <Table.Td>{row.shareholdingPercentage}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Company Financial Statement Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  {`COMPANY FINANCIAL STATEMENT (AS OF LAST FINANCIAL FILED ON ${lastFinancialFiledDate})`}
                </h1>
                <div className="pt-3">
                  <Table
                    withRowBorders={false}
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    <Table.Tbody>
                      {financialStatementData.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td
                            style={{
                              fontWeight: 'bold',
                              textAlign: 'left',
                              verticalAlign: 'top',
                              width: '270px',
                            }}
                          >
                            {row.header}
                          </Table.Td>
                          <Table.Td
                            style={{ textAlign: 'left', verticalAlign: 'top' }}
                          >
                            {row.value || '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Company Charges Details Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  COMPANY CHARGES
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Charge Number</Table.Th>
                        <Table.Th>Charge Status</Table.Th>
                        <Table.Th>No. of Charges</Table.Th>
                        <Table.Th>Total of Charge</Table.Th>
                        <Table.Th>Date of Creation</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {companyChargesTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>{row.chargeNumber}</Table.Td>
                          <Table.Td>{row.chargeStatus}</Table.Td>
                          <Table.Td>{row.nameOfChargee}</Table.Td>
                          <Table.Td>{row.totalOfCharge}</Table.Td>
                          <Table.Td>{row.dateOfCreation}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Interest In Other Companies Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  INTEREST IN OTHER COMPANIES
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Local No.</Table.Th>
                        <Table.Th>Company</Table.Th>
                        <Table.Th>Shareholding</Table.Th>
                        <Table.Th>Shareholding Percentage (%)</Table.Th>
                        <Table.Th>Remarks</Table.Th>
                        <Table.Th>As At</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {interestInOtherCompanyTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>{row.localNo}</Table.Td>
                          <Table.Td>{row.company}</Table.Td>
                          <Table.Td>{row.shareholding}</Table.Td>
                          <Table.Td>{row.shareholdingPercentage}</Table.Td>
                          <Table.Td>{row.remark}</Table.Td>
                          <Table.Td>{row.asAt}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Legal Action Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  LEGAL ACTION
                </h1>
                <h1
                  className="font-bold text-xs pb-1 px-2.5 pt-5"
                  style={{
                    color: color.DARKGREY,
                  }}
                >
                  LEGAL SUITS - SUBJECT AS DEFENDANT
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Defendant Name</Table.Th>
                        <Table.Th>Plaintiff Name</Table.Th>
                        <Table.Th>Case Status</Table.Th>
                        <Table.Th>Suit Ref.</Table.Th>
                        <Table.Th>Local No.</Table.Th>
                        <Table.Th>Hearing Date</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {legalSuitsSubjectAsDefendantTableRows.map(
                        (row, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{row.defendantName}</Table.Td>
                            <Table.Td>{row.plaintiffName}</Table.Td>
                            <Table.Td>{row.caseStatus}</Table.Td>
                            <Table.Td>{row.suitRef}</Table.Td>
                            <Table.Td>{row.defendantLocalNumber}</Table.Td>
                            <Table.Td>{row.hearingDate}</Table.Td>
                          </Table.Tr>
                        )
                      )}
                    </Table.Tbody>
                  </Table>
                </div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5 pt-5"
                  style={{
                    color: color.DARKGREY,
                  }}
                >
                  LEGAL SUITS - SUBJECT AS PLAINTIFF
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Defendant Name</Table.Th>
                        <Table.Th>Plaintiff Name</Table.Th>
                        <Table.Th>Case Status</Table.Th>
                        <Table.Th>Suit Ref.</Table.Th>
                        <Table.Th>Local No.</Table.Th>
                        <Table.Th>Hearing Date</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {legalSuitsSubjectAsPlaintiffTableRows.map(
                        (row, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{row.plaintiffName}</Table.Td>
                            <Table.Td>{row.caseStatus}</Table.Td>
                            <Table.Td>{row.suitRef}</Table.Td>
                            <Table.Td>{row.plaintiffLocalNumber}</Table.Td>
                            <Table.Td>{row.hearingDate}</Table.Td>
                          </Table.Tr>
                        )
                      )}
                    </Table.Tbody>
                  </Table>
                </div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5 pt-5"
                  style={{
                    color: color.DARKGREY,
                  }}
                >
                  WINDING-UP ACTION - SUBJECT AS DEFENDANT
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Court Type</Table.Th>
                        <Table.Th>Case Number</Table.Th>
                        <Table.Th>Defendant Name</Table.Th>
                        <Table.Th>Solicitor Address</Table.Th>
                        <Table.Th>Defendant Local Number</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {windingUpActionSubjectAsDefendantTableRows.map(
                        (row, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{row.courtType}</Table.Td>
                            <Table.Td>{row.caseNumber}</Table.Td>
                            <Table.Td>{row.defendantName}</Table.Td>
                            <Table.Td>{row.solicitorAddress}</Table.Td>
                            <Table.Td>{row.defendantLocalNumber}</Table.Td>
                          </Table.Tr>
                        )
                      )}
                    </Table.Tbody>
                  </Table>
                </div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5 pt-5"
                  style={{
                    color: color.DARKGREY,
                  }}
                >
                  WINDING-UP ACTION - SUBJECT AS PETITIONER
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Court Type</Table.Th>
                        <Table.Th>Case Number</Table.Th>
                        <Table.Th>Defendant Name</Table.Th>
                        <Table.Th>Petitioner Name</Table.Th>
                        <Table.Th>Solicitor Address</Table.Th>
                        <Table.Th>Defendant Local Number</Table.Th>
                        <Table.Th>Petitioner Local Number</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {windingUpActionSubjectAsPetitionerTableRows.map(
                        (row, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{row.courtType}</Table.Td>
                            <Table.Td>{row.caseNumber}</Table.Td>
                            <Table.Td>{row.defendantName}</Table.Td>
                            <Table.Td>{row.petitionerName}</Table.Td>
                            <Table.Td>{row.solicitorAddress}</Table.Td>
                            <Table.Td>{row.defendantLocalNumber}</Table.Td>
                            <Table.Td>{row.petitionerLocalNumber}</Table.Td>
                          </Table.Tr>
                        )
                      )}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Credit Score Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  Credit Score
                </h1>
                <div className="pt-3">
                  <Table
                    withRowBorders={false}
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    <Table.Tbody>
                      {creditScoreTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td
                            style={{
                              fontWeight: 'bold',
                              textAlign: 'left',
                              verticalAlign: 'top',
                              width: '100px',
                            }}
                          >
                            {row.header}
                          </Table.Td>
                          <Table.Td
                            style={{ textAlign: 'left', verticalAlign: 'top' }}
                          >
                            {row.value || '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Summary Credit Information Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  Summary Credit Information
                </h1>
                <div className="pt-3">
                  <Table
                    withRowBorders={false}
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    <Table.Tbody>
                      {summaryCreditInformationTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td
                            style={{
                              fontWeight: 'bold',
                              textAlign: 'left',
                              verticalAlign: 'top',
                              width: '350px',
                            }}
                          >
                            {row.header}
                          </Table.Td>
                          <Table.Td
                            style={{ textAlign: 'left', verticalAlign: 'top' }}
                          >
                            {row.value || '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Detailed Credit Report Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  Detailed Credit Report
                </h1>
                <div className="pt-3 px-2.5">
                  <Table
                    withTableBorder={true}
                    withRowBorders={true}
                    withColumnBorders={true}
                    style={{
                      fontSize: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th rowSpan={3}>Facility</Table.Th>
                        <Table.Th rowSpan={3}>Col Type</Table.Th>
                        <Table.Th rowSpan={3}>
                          Total Outstanding Balance (RM)
                        </Table.Th>
                        <Table.Th rowSpan={3}>Date Balance Updated</Table.Th>
                        <Table.Th rowSpan={3}>
                          Limit / Installment Amount
                        </Table.Th>
                        <Table.Th rowSpan={3}>Prin Repayment Term</Table.Th>
                        <Table.Th colSpan={12}>
                          Conduct of Account for the Last 12 Months
                        </Table.Th>
                      </Table.Tr>
                      <Table.Tr>
                        {years.map((year) => (
                          <Table.Th
                            key={year}
                            colSpan={monthsByYear[year].length}
                          >
                            {year}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                      <Table.Tr>
                        {years.flatMap((year) =>
                          monthsByYear[year].map((month) => (
                            <Table.Th key={`${year}-${month}`}>
                              {month}
                            </Table.Th>
                          ))
                        )}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {detailedCreditReportTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>{row.facility}</Table.Td>
                          <Table.Td>{row.colType}</Table.Td>
                          <Table.Td>{row.totalOutstandingBalance}</Table.Td>
                          <Table.Td>{row.dateBalanceUpdated}</Table.Td>
                          <Table.Td>{row.limitInstallmentAmount}</Table.Td>
                          <Table.Td>{row.printRepaymentTerm}</Table.Td>
                          {/* Render conductOfAccount values */}
                          {row.conductOfAccount.map((record, conductIndex) => (
                            <Table.Td key={`${index}-${conductIndex}`}>
                              {record.value || '-'}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Facilities Information Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  Facilities Information
                </h1>
                <div className="pt-3">
                  <Table
                    withRowBorders={false}
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    <Table.Tbody>
                      {facilitiesInformationTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td
                            style={{
                              fontWeight: 'bold',
                              textAlign: 'left',
                              verticalAlign: 'top',
                              width: '300px',
                            }}
                          >
                            {row.header}
                          </Table.Td>
                          <Table.Td
                            style={{ textAlign: 'left', verticalAlign: 'top' }}
                          >
                            {row.value || '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Credit Facilities Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  Credit Facilities
                </h1>
                <div className="pt-3">
                  <Table
                    withRowBorders={false}
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    <Table.Tbody>
                      {creditFacilitiesInformationTableRows.map(
                        (row, index) => (
                          <Table.Tr key={index}>
                            <Table.Td
                              style={{
                                fontWeight: 'bold',
                                textAlign: 'left',
                                verticalAlign: 'top',
                                width: '300px',
                              }}
                            >
                              {row.header}
                            </Table.Td>
                            <Table.Td
                              style={{
                                textAlign: 'left',
                                verticalAlign: 'top',
                              }}
                            >
                              {row.value || '-'}
                            </Table.Td>
                          </Table.Tr>
                        )
                      )}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Financing Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  Financing
                </h1>
                <div className="pt-3">
                  <Table
                    withRowBorders={false}
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    <Table.Tbody>
                      {financingTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td
                            style={{
                              fontWeight: 'bold',
                              textAlign: 'left',
                              verticalAlign: 'top',
                              width: '300px',
                            }}
                          >
                            {row.header}
                          </Table.Td>
                          <Table.Td
                            style={{ textAlign: 'left', verticalAlign: 'top' }}
                          >
                            {row.value || '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
              <div className="py-3">
                <Divider my="sm" />
              </div>
              {/* Lenders Information Table */}
              <div>
                <h1
                  className="font-bold text-xs pb-1 px-2.5"
                  style={{
                    color: color.GRAPE,
                  }}
                >
                  Lenders Information
                </h1>
                <div className="pt-3">
                  <Table
                    withRowBorders={false}
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    <Table.Tbody>
                      {lendersInformationTableRows.map((row, index) => (
                        <Table.Tr key={index}>
                          <Table.Td
                            style={{
                              fontWeight: 'bold',
                              textAlign: 'left',
                              verticalAlign: 'top',
                              width: '300px',
                            }}
                          >
                            {row.header}
                          </Table.Td>
                          <Table.Td
                            style={{ textAlign: 'left', verticalAlign: 'top' }}
                          >
                            {row.value || '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </div>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    );
  };

  const onClickRedirectBackToOrgList = () => {
    navigate(ADMIN.ORGANIZATIONS);
  };

  const applications = organizationData.applications;

  // Extract unique personas
  const uniquePersonas = Array.from(
    new Set<string>(
      applications.map(
        (app: { applicationPersona: string }) => app.applicationPersona
      )
    )
  );

  const firstApplicationPersonaTab = uniquePersonas[0]?.toLowerCase() || ''; // Safely get the first tab

  // Extract tab from URL (e.g., /dashboard?tab=profile)
  const currentTab =
    new URLSearchParams(location.search).get('tab') || 'organizationProfile';

  const handleTabChange = (value: any) => {
    navigate(`?tab=${value}`); // Update URL query param
  };

  return (
    <div className="min-h-screen px-[5%] py-4">
      <div className="pb-8">
        <Button
          variant="transparent"
          className="w-full md:w-auto text-xs -mx-4"
          style={{
            color: '#000000',
          }}
          leftSection={<IconChevronLeft size={18} />}
          onClick={onClickRedirectBackToOrgList}
        >
          Back to Organization List
        </Button>
      </div>
      <h1 className="text-3xl font-extrabold">
        {organizationData.organizationName.toUpperCase()}
      </h1>
      <div className="flex gap-2 flex-wrap py-3">
        {/* Render the badge for applicationPersona */}
        {organizationData.applications.map((application: any) => (
          <div key={application.id}>
            {/* Render badges for applicationPersona */}
            {
              <Badge
                radius="sm"
                size="md"
                color={
                  personaBadgeColors[application.applicationPersona] || 'gray'
                } // Fallback color
                variant="light"
                style={{ marginRight: '8px' }}
              >
                {application.applicationPersona}
              </Badge>
            }
          </div>
        ))}
      </div>
      <div className="pb-7 pt-5">
        <Tabs
          value={currentTab}
          color={color.GRAPE}
          orientation="vertical"
          onChange={handleTabChange}
        >
          {/* Tabs in organizationProfile tab */}
          <Tabs.List>
            <Tabs.Tab
              value="organizationProfile"
              leftSection={<IconBuilding size={16} />}
              style={{ fontSize: '13px' }}
            >
              Organization Profile
            </Tabs.Tab>
            <Tabs.Tab
              value="kycAndCompliance"
              leftSection={<IconUserScan size={16} />}
              style={{ fontSize: '13px' }}
            >
              KYC & Compliance
            </Tabs.Tab>
            <Tabs.Tab
              value="facility"
              leftSection={<IconCash size={16} />}
              style={{ fontSize: '13px' }}
            >
              Facility
            </Tabs.Tab>
            <Tabs.Tab
              value="documents"
              leftSection={<IconClipboardText size={16} />}
              style={{ fontSize: '13px' }}
            >
              Documents
            </Tabs.Tab>
            <Tabs.Tab
              value="risk"
              leftSection={<IconChartPie size={16} />}
              style={{ fontSize: '13px' }}
            >
              Risk
            </Tabs.Tab>
          </Tabs.List>

          {/* Organization Profile */}
          <Tabs.Panel value="organizationProfile">
            <div className="pl-8">
              <Tabs
                defaultValue="businessProfile"
                color={color.GRAPE}
                variant="outline"
              >
                <Tabs.List>
                  <Tabs.Tab
                    value="businessProfile"
                    style={{ fontSize: '13px' }}
                  >
                    Business Profile
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="kycAgencyReports"
                    style={{ fontSize: '13px' }}
                  >
                    KYC Agency Reports
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="businessProfile">
                  <div className="pt-8">
                    {/* Profile Card */}
                    <div className="border bg-white border-zinc-300 rounded-md py-6 px-4">
                      <h1 className="font-semibold text-xs pb-1 px-2.5">
                        Profile
                      </h1>
                      <div className="-mx-4">
                        <Divider my="sm" className="pb-1" />
                      </div>
                      <div>
                        <Table
                          withRowBorders={false}
                          style={{
                            fontSize: '12px',
                          }}
                        >
                          <Table.Tbody>{profileTableRows}</Table.Tbody>
                        </Table>
                      </div>
                    </div>

                    {/* Applications Details Card */}
                    <div className="border bg-white border-zinc-300 rounded-md py-6 px-4 mt-8">
                      <h1 className="font-semibold text-xs pb-1 px-2.5">
                        Applications
                      </h1>
                      <div className="-mx-4">
                        <Divider my="sm" />
                      </div>
                      <div
                        style={{
                          overflowX: 'auto', // Enable horizontal scrolling for the MantineTable
                          overflowY: 'auto',
                        }}
                      >
                        <div className="p-3">
                          {/* Display tabs if applications > 0 */}
                          {applications.length > 0 ? (
                            <Tabs
                              variant="outline"
                              radius="xs"
                              defaultValue={firstApplicationPersonaTab} // Default tab set dynamically
                            >
                              <Tabs.List>
                                {uniquePersonas.map((persona: any) => (
                                  <Tabs.Tab
                                    key={persona}
                                    value={persona.toLowerCase()}
                                    style={{ fontSize: '13px' }}
                                  >
                                    {persona.charAt(0).toUpperCase() +
                                      persona.slice(1).toLowerCase()}
                                  </Tabs.Tab>
                                ))}
                              </Tabs.List>

                              {uniquePersonas.map((persona: any) => (
                                <Tabs.Panel
                                  key={persona}
                                  value={persona.toLowerCase()}
                                >
                                  <div>
                                    {applications
                                      .filter(
                                        (app: any) =>
                                          app.applicationPersona === persona
                                      )
                                      .map((app: any, index: string) => (
                                        <div
                                          key={index}
                                          className="text-xs mt-6 p-6 border rounded-lg border-zinc-300"
                                        >
                                          <p>
                                            <strong>Application Number:</strong>{' '}
                                            {app.applicationNumber}
                                          </p>
                                          <p className="pt-3">
                                            <strong>
                                              Application Status:{' '}
                                            </strong>{' '}
                                            <Badge
                                              size="sm"
                                              variant="light"
                                              color={
                                                app.applicationStatus ===
                                                'DRAFT'
                                                  ? 'blue'
                                                  : app.applicationStatus ===
                                                      'PENDING_RISK_FILTER_1'
                                                    ? 'green'
                                                    : app.applicationStatus ===
                                                        'PENDING_RISK_FILTER_2'
                                                      ? 'green'
                                                      : 'gray'
                                              }
                                            >
                                              {app.applicationStatus}
                                            </Badge>
                                          </p>
                                          <p className="pt-3">
                                            <strong>Application Date:</strong>{' '}
                                            {new Date(
                                              app.applicationDate
                                            ).toLocaleDateString()}
                                          </p>
                                          <Divider my="md" />
                                          <div>
                                            <p className="pb-3">
                                              <strong>
                                                Organization Persons
                                              </strong>
                                            </p>
                                            {app.applicationPersons.length >
                                            0 ? (
                                              <>
                                                <Table
                                                  withColumnBorders={true}
                                                  withRowBorders={true}
                                                  withTableBorder={true}
                                                  className="text-xs"
                                                >
                                                  <Table.Thead className="text-xs">
                                                    <Table.Tr>
                                                      <Table.Th>Name</Table.Th>
                                                      <Table.Th>
                                                        Identification No.
                                                      </Table.Th>
                                                      <Table.Th>Type</Table.Th>
                                                      <Table.Th>Email</Table.Th>
                                                      <Table.Th>
                                                        Contact Number
                                                      </Table.Th>
                                                      <Table.Th>
                                                        Address
                                                      </Table.Th>
                                                      <Table.Th>
                                                        Designation
                                                      </Table.Th>
                                                    </Table.Tr>
                                                  </Table.Thead>
                                                  <Table.Tbody className="text-xs">
                                                    {app.applicationPersons.map(
                                                      (person: any) => (
                                                        <Table.Tr
                                                          key={person.id}
                                                        >
                                                          <Table.Td>
                                                            {person.name ?? '-'}
                                                          </Table.Td>
                                                          <Table.Td>
                                                            {person.identificationNumber ??
                                                              '-'}
                                                          </Table.Td>
                                                          <Table.Td>
                                                            {Array.isArray(
                                                              person.applicationPersonTypes
                                                            )
                                                              ? person.applicationPersonTypes.join(
                                                                  ', '
                                                                )
                                                              : person.applicationPersonType ??
                                                                '-'}
                                                          </Table.Td>
                                                          <Table.Td>
                                                            {person.email ??
                                                              '-'}
                                                          </Table.Td>
                                                          <Table.Td>
                                                            {person.mobileNumber ??
                                                              '-'}
                                                          </Table.Td>
                                                          <Table.Td>
                                                            {person.residentialAddress ??
                                                              '-'}
                                                          </Table.Td>
                                                          <Table.Td>
                                                            {Array.isArray(
                                                              person.designations
                                                            )
                                                              ? person.designations
                                                                  .filter(
                                                                    Boolean
                                                                  )
                                                                  .join(', ')
                                                              : person.designations ??
                                                                '-'}
                                                          </Table.Td>
                                                        </Table.Tr>
                                                      )
                                                    )}
                                                  </Table.Tbody>
                                                </Table>
                                              </>
                                            ) : (
                                              <p className="text-xs">
                                                No organization person
                                                available.
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </Tabs.Panel>
                              ))}
                            </Tabs>
                          ) : (
                            <div>
                              <p className="text-xs">
                                No applications available.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel value="kycAgencyReports">
                  {/* KYC agency reports card */}
                  <div className="border bg-white border-zinc-300 rounded-md flex-1 py-6 px-4 mt-6">
                    <h1 className="font-semibold text-xs pb-1 px-2.5">
                      KYC Agency Reports
                    </h1>
                    <div></div>
                    <div className="-mx-4">
                      <Divider my="sm" className="pb-1" />
                    </div>
                    <div className="px-2.5 pt-2">
                      <KycReportTabs
                        kycAgencyReports={organizationData.kycAgencyReports}
                      />
                    </div>
                  </div>
                </Tabs.Panel>
              </Tabs>
            </div>
          </Tabs.Panel>

          {/* Risk */}
          <Tabs.Panel value="risk">
            <div className="pl-8">
              <RiskFilters applicationArray={organizationData.applications} />
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationView;
