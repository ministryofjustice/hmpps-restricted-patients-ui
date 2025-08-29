const alertFlagLabels = [
  { alertCodes: ['HA'], classes: 'alert-status alert-status--self-harm', label: 'ACCT open' },
  {
    alertCodes: ['HA1'],
    classes: 'alert-status alert-status--self-harm',
    label: 'ACCT post closure',
  },
  {
    alertCodes: ['XSA', 'SA'],
    classes: 'alert-status alert-status--security',
    label: 'Staff assaulter',
  },
  {
    alertCodes: ['XA'],
    classes: 'alert-status alert-status--security',
    label: 'Arsonist',
  },
  {
    alertCodes: ['PEEP'],
    classes: 'alert-status alert-status--medical',
    label: 'PEEP',
  },
  {
    alertCodes: ['HID'],
    classes: 'alert-status alert-status--medical',
    label: 'Hidden disability',
  },
  { alertCodes: ['XEL'], classes: 'alert-status alert-status--security', label: 'E-list' },
  { alertCodes: ['XELH'], classes: 'alert-status alert-status--security', label: 'E-list heightened' },
  { alertCodes: ['XER'], classes: 'alert-status alert-status--security', label: 'Escape risk' },
  {
    alertCodes: ['XRF'],
    classes: 'alert-status alert-status--security',
    label: 'Risk to females',
  },
  { alertCodes: ['XTACT'], classes: 'alert-status alert-status--security', label: 'TACT' },
  {
    alertCodes: ['XCO'],
    classes: 'alert-status alert-status--security',
    label: 'Corruptor',
  },
  {
    alertCodes: ['XCA'],
    classes: 'alert-status alert-status--security',
    label: 'Chemical attacker',
  },
  {
    alertCodes: ['XCI'],
    classes: 'alert-status alert-status--security',
    label: 'Concerted indiscipline',
  },
  { alertCodes: ['XR'], classes: 'alert-status alert-status--security', label: 'Racist' },
  {
    alertCodes: ['RTP', 'RLG'],
    classes: 'alert-status alert-status--risk',
    label: 'Risk to LGBT',
  },
  {
    alertCodes: ['XHT'],
    classes: 'alert-status alert-status--security',
    label: 'Hostage taker',
  },
  {
    alertCodes: ['XCU'],
    classes: 'alert-status alert-status--security',
    label: 'Controlled unlock',
  },
  {
    alertCodes: ['XGANG'],
    classes: 'alert-status alert-status--security',
    label: 'Gang member',
  },
  { alertCodes: ['CSIP'], classes: 'alert-status alert-status--other', label: 'CSIP' },
  { alertCodes: ['F1'], classes: 'alert-status alert-status--ex-armed-forces', label: 'Veteran' },
  {
    alertCodes: ['LCE'],
    classes: 'alert-status alert-status--care-leaver',
    label: 'Care experienced',
  },
  {
    alertCodes: ['RNO121'],
    classes: 'alert-status alert-status--risk',
    label: 'No one-to-one',
  },
  { alertCodes: ['RCON'], classes: 'alert-status alert-status--risk', label: 'Conflict' },
  {
    alertCodes: ['RCDR'],
    classes: 'alert-status alert-status--quarantined',
    label: 'Quarantined',
  },
  {
    alertCodes: ['URCU'],
    classes: 'alert-status alert-status--reverse-cohorting-unit',
    label: 'Reverse Cohorting Unit',
  },
  {
    alertCodes: ['UPIU'],
    classes: 'alert-status alert-status--protective-isolation-unit',
    label: 'Protective Isolation Unit',
  },
  { alertCodes: ['USU'], classes: 'alert-status alert-status--shielding-unit', label: 'Shielding Unit' },
  { alertCodes: ['URS'], classes: 'alert-status alert-status--refusing-to-shield', label: 'Refusing to shield' },
  { alertCodes: ['RKS'], classes: 'alert-status alert-status--risk-to-known-adults', label: 'Risk to known adults' },
  { alertCodes: ['VIP'], classes: 'alert-status alert-status--isolated-prisoner', label: 'Isolated' },
  { alertCodes: ['PVN'], classes: 'alert-status alert-status--multicase alert-status--visor', label: 'ViSOR' },
  {
    alertCodes: ['XCDO'],
    classes: 'alert-status alert-status--security',
    label: 'Involved in 2024 civil disorder',
  },
  {
    alertCodes: ['XVL'],
    classes: 'alert-status alert-status--security',
    label: 'Violent',
  },
].sort((a, b) => a.label.localeCompare(b.label))

export const profileAlertCodes = [
  'HA',
  'HA1',
  'XSA',
  'XA',
  'PEEP',
  'HID',
  'XEL',
  'XELH',
  'XER',
  'XRF',
  'XTACT',
  'XCO',
  'XCA',
  'XCI',
  'XR',
  'RTP',
  'RLG',
  'XHT',
  'XCU',
  'XGANG',
  'CSIP',
  'F1',
  'LCE',
  'RNO121',
  'RCON',
  'RCDR',
  'URCU',
  'UPIU',
  'USU',
  'URS',
  'PVN',
  'RKS',
  'VIP',
  'XCDO',
  'XVL',
]

export type AlertType = {
  alertType: string
  alertCode: string
  active: boolean
  expired: boolean
}

export type FormattedAlertType = {
  alertCodes: string[]
  classes: string
  label: string
}

export function getFormattedAlerts(allPrisonAlerts: AlertType[]): FormattedAlertType[] {
  const activePrisonerAlerts = allPrisonAlerts?.filter((alert: AlertType) => !alert.expired)
  const prisonerAlerts = activePrisonerAlerts?.map((alert: AlertType) => alert.alertCode)
  const alertCodesToShow = profileAlertCodes.filter(alertFlag => prisonerAlerts?.includes(alertFlag))

  return alertFlagLabels.filter(alertFlag => alertFlag.alertCodes.some(alert => alertCodesToShow?.includes(alert)))
}
