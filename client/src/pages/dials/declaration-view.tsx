import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { DialRecordWithRelations } from "@shared/schema";
import { format } from "date-fns";

export default function DeclarationView() {
  const params = useParams();
  const dialId = parseInt(params.id || "");

  const { data: declaration, isLoading } = useQuery<DialRecordWithRelations>({
    queryKey: ["/api/dial", dialId],
    enabled: !!dialId,
  });

  const handleDownloadPDF = () => {
    window.open(`/api/dial/${dialId}/pdf`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Declaration not found</h3>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary" as const,
      submitted: "default" as const,
      under_review: "default" as const,
      approved: "default" as const,
      locked: "default" as const,
    };

    const labels = {
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under Review",
      approved: "Approved",
      locked: "Locked",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const incomeItems = declaration.statementItems?.filter(item => item.category === "income") || [];
  const assetItems = declaration.statementItems?.filter(item => item.category === "asset") || [];
  const liabilityItems = declaration.statementItems?.filter(item => item.category === "liability") || [];

  const totalIncome = incomeItems.reduce((sum, item) => sum + (item.approximateAmount || 0), 0);
  const totalAssets = assetItems.reduce((sum, item) => sum + (item.approximateAmount || 0), 0);
  const totalLiabilities = liabilityItems.reduce((sum, item) => sum + (item.approximateAmount || 0), 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Declaration Preview</h1>
          <p className="text-base text-muted-foreground mt-2">
            Declaration of Income, Assets & Liabilities
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {getStatusBadge(declaration.status || "draft")}
          {(declaration.status === "approved" || declaration.status === "locked") && (
            <Button onClick={handleDownloadPDF} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Officer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Officer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-base mt-1">
                {declaration.user?.firstName} {declaration.user?.surname}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-base mt-1">{declaration.user?.email || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
              <p className="text-base mt-1">
                {declaration.dateOfBirth
                  ? format(new Date(declaration.dateOfBirth), "MMM dd, yyyy")
                  : "—"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Place of Birth</label>
              <p className="text-base mt-1">{declaration.placeOfBirth || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
              <p className="text-base mt-1 capitalize">{declaration.maritalStatus || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employment Number</label>
              <p className="text-base mt-1">{declaration.employmentNumber || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spouses */}
      {declaration.spouses && declaration.spouses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-medium">Spouse(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {declaration.spouses.map((spouse, index) => (
                <div key={spouse.id} className="p-4 border rounded-lg">
                  <Badge variant="secondary" className="mb-3">Spouse {index + 1}</Badge>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Surname</label>
                      <p className="text-base mt-1">{spouse.surname}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name</label>
                      <p className="text-base mt-1">{spouse.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Other Names</label>
                      <p className="text-base mt-1">{spouse.otherNames || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependents */}
      {declaration.dependents && declaration.dependents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-medium">Dependent Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {declaration.dependents.map((dependent, index) => (
                <div key={dependent.id} className="p-4 border rounded-lg">
                  <Badge variant="secondary" className="mb-3">Dependent {index + 1}</Badge>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Surname</label>
                      <p className="text-base mt-1">{dependent.surname}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name</label>
                      <p className="text-base mt-1">{dependent.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Other Names</label>
                      <p className="text-base mt-1">{dependent.otherNames || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statement Period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Statement Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Statement Date</label>
              <p className="text-base mt-1">
                {declaration.statementDate
                  ? format(new Date(declaration.statementDate), "MMMM dd, yyyy")
                  : "—"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Period Start</label>
              <p className="text-base mt-1">
                {declaration.periodStart
                  ? format(new Date(declaration.periodStart), "MMMM dd, yyyy")
                  : "—"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Period End</label>
              <p className="text-base mt-1">
                {declaration.periodEnd
                  ? format(new Date(declaration.periodEnd), "MMMM dd, yyyy")
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Statement of Income</CardTitle>
          <CardDescription>Total: KES {totalIncome.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          {incomeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No income items</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (KES)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right font-mono">
                      {item.approximateAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Statement of Assets</CardTitle>
          <CardDescription>Total: KES {totalAssets.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          {assetItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No asset items</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Amount (KES)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.location || "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {item.approximateAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Statement of Liabilities</CardTitle>
          <CardDescription>Total: KES {totalLiabilities.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          {liabilityItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No liability items</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (KES)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilityItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right font-mono">
                      {item.approximateAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Other Information */}
      {declaration.otherInformation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-medium">Other Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{declaration.otherInformation}</p>
          </CardContent>
        </Card>
      )}

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Officer Signature</h3>
            {declaration.officerSignatureData ? (
              <div className="space-y-2">
                <img
                  src={declaration.officerSignatureData}
                  alt="Officer Signature"
                  className="border rounded-lg p-4 bg-background h-48 object-contain"
                />
                <p className="text-sm text-muted-foreground">
                  Signed on:{" "}
                  {declaration.officerSignatureDate
                    ? format(new Date(declaration.officerSignatureDate), "MMMM dd, yyyy")
                    : "—"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not signed</p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Witness Signature</h3>
            {declaration.witnessSignatureData ? (
              <div className="space-y-4">
                <img
                  src={declaration.witnessSignatureData}
                  alt="Witness Signature"
                  className="border rounded-lg p-4 bg-background h-48 object-contain"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Witness Name</label>
                    <p className="text-base mt-1">{declaration.witnessName || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-base mt-1">
                      {declaration.witnessSignatureDate
                        ? format(new Date(declaration.witnessSignatureDate), "MMMM dd, yyyy")
                        : "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Witness Address</label>
                  <p className="text-base mt-1 whitespace-pre-wrap">{declaration.witnessAddress || "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not signed</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
