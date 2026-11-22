/**
 * Safety (report & block). Other features import from here:
 *   <ReportSheet open targetType="message" targetId={msg.id} onClose={…} />
 * McGill contacts live only in ./mcgillContacts.ts.
 */
export { ReportSheet, type ReportSheetProps, type ReportSheetTarget } from './ReportSheet';
export { ProfileSafetyMenu } from './ProfileSafetyMenu';
export { BlockedProfile } from './BlockedProfile';
export { MyReportsList } from './MyReportsList';
export { EmergencyCard } from './ContactCards';
export * as mcgillContacts from './mcgillContacts';
