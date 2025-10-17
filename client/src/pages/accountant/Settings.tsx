import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Building, DollarSign, FileText, Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accounting Settings</h1>
        <p className="text-gray-600 mt-2">Configure accounting system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Organization Settings
            </CardTitle>
            <CardDescription>Configure organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="Trans Nzoia County Public Service Board" data-testid="input-org-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financial-year">Current Financial Year</Label>
              <Input id="financial-year" defaultValue="2024/2025" data-testid="input-financial-year" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Input id="currency" defaultValue="KES" data-testid="input-currency" />
            </div>
            <Button data-testid="button-save-org">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Settings
            </CardTitle>
            <CardDescription>Configure financial parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imprest-limit">Maximum Imprest Amount</Label>
              <Input id="imprest-limit" type="number" defaultValue="100000" data-testid="input-imprest-limit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-limit">Maximum Claim Amount</Label>
              <Input id="claim-limit" type="number" defaultValue="50000" data-testid="input-claim-limit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retirement-days">Imprest Retirement Days</Label>
              <Input id="retirement-days" type="number" defaultValue="7" data-testid="input-retirement-days" />
            </div>
            <Button data-testid="button-save-financial">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Settings
            </CardTitle>
            <CardDescription>Configure document templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Voucher Template</Label>
              <Button variant="outline" className="w-full justify-start" data-testid="button-voucher-template">
                <FileText className="w-4 h-4 mr-2" />
                Edit Template
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Claim Form Template</Label>
              <Button variant="outline" className="w-full justify-start" data-testid="button-claim-template">
                <FileText className="w-4 h-4 mr-2" />
                Edit Template
              </Button>
            </div>
            <div className="space-y-2">
              <Label>MIR Template</Label>
              <Button variant="outline" className="w-full justify-start" data-testid="button-mir-template">
                <FileText className="w-4 h-4 mr-2" />
                Edit Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              System Settings
            </CardTitle>
            <CardDescription>General system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Input id="email-notifications" type="email" placeholder="accountant@example.com" data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-backup">Auto Backup Frequency</Label>
              <Input id="auto-backup" defaultValue="Daily" data-testid="input-backup" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-schedule">Report Generation Schedule</Label>
              <Input id="report-schedule" defaultValue="Monthly" data-testid="input-report-schedule" />
            </div>
            <Button data-testid="button-save-system">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
