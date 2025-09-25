import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useFileUpload, uploadConfigs } from "@/hooks/useFileUpload";
import DocumentViewer from "@/components/documents/DocumentViewer";

type Document = {
  id: number;
  type: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
};

type ProfileResponse = {
  applicantProfile?: {
    documents?: Document[];
  };
};

type DocumentType = {
  id: string;
  label: string;
  required: boolean;
};

type ApplicantDocumentsProps = {
  columns?: "1" | "2" | "3"; // grid layout
  showNavigation?: boolean; // toggle Navigation
  mode?: "manage" | "view"; // upload or view only
  documentTypes?: DocumentType[]; // custom document types
  allowedFileTypes?: string[]; // accepted file types
};

const defaultDocumentTypes: DocumentType[] = [
  { id: "national_id", label: "National ID", required: true },
  { id: "birth_certificate", label: "Birth Certificate", required: true },
  { id: "academic_certificate", label: "Academic Certificate", required: true },
  { id: "academic_transcript", label: "Academic Transcript", required: true },
  { id: "professional_certificate", label: "Professional Certificate", required: false },
  { id: "experience_letter", label: "Experience Letter", required: false },
  { id: "clearance_certificate", label: "Police Clearance", required: true },
];

export default function ApplicantDocument({
  columns = "3",
  showNavigation = true,
  mode = "manage",
  documentTypes = defaultDocumentTypes,
  allowedFileTypes = [".pdf"],
}: ApplicantDocumentsProps) {
  const { user } = useAuth();
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const { data: profile, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const documents = profile?.applicantProfile?.documents || [];

  const { uploadFile, state } = useFileUpload((uploadConfigs as any).documents);

  const handleFileUpload = async (file: File, type: string) => {
    if (mode === "manage") {
      await uploadFile(file, type, { type });
    }
  };

  const getDocumentStatus = (type: string) => {
    const document = documents.find((doc) => doc.type === type);
    if (document) {
      return { status: "uploaded", document };
    }
    return { status: "pending", document: null };
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {showNavigation && <Navigation />}
        <div className="flex justify-center items-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {showNavigation && <Navigation />}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">
            {mode === "manage"
              ? "Upload and manage your required documents"
              : "View uploaded documents"}
          </p>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}
        >
          {documentTypes.map((docType) => {
            const { status, document } = getDocumentStatus(docType.id);
            const isUploading =
              state.uploadProgress[docType.id] || state.isUploading;

            return (
              <Card key={docType.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{docType.label}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {docType.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {status === "uploaded" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-300"
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {document ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {document.fileName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(document.fileSize)} •{" "}
                            {new Date(document.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingDocument(document)}
                        >
                          View
                        </Button>
                      </div>

                      {mode === "manage" && (
                        <div className="border-t pt-4">
                          <label
                            htmlFor={`replace-${docType.id}`}
                            className="block text-sm text-gray-700 mb-2"
                          >
                            Replace document:
                          </label>
                          <input
                            id={`replace-${docType.id}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, docType.id);
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                              file:rounded-md file:border-0 file:text-sm file:font-medium 
                              file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            disabled={isUploading}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    mode === "manage" && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                          Upload your {docType.label.toLowerCase()}
                        </p>
                        <label htmlFor={`upload-${docType.id}`}>
                          <Button variant="outline" disabled={isUploading} asChild>
                            <span>
                              {isUploading ? "Uploading..." : "Choose File"}
                            </span>
                          </Button>
                        </label>
                        <input
                          id={`upload-${docType.id}`}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, docType.id);
                          }}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Supports {allowedFileTypes.join(", ")} (max 10MB)
                        </p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {mode === "manage" && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Upload Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure all documents are clear and legible</li>
              <li>• Documents should be in PDF, JPG, JPEG, or PNG format</li>
              <li>• Maximum file size is 10MB per document</li>
              <li>• All required documents must be uploaded before submitting applications</li>
            </ul>
          </div>
        )}

        {viewingDocument && (
          <DocumentViewer
            document={viewingDocument}
            isOpen={!!viewingDocument}
            onClose={() => setViewingDocument(null)}
          />
        )}
      </div>
    </div>
  );
}
