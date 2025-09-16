'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  FileText, 
  Upload,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface SellerProfile {
  id: string;
  businessName: string;
  gstNumber: string;
  panNumber: string;
  businessAddress: string;
  status: string;
  rejectionReason: string;
  documents: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  }[];
  user: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    pincode: string;
  };
}

export default function SellerProfile() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    gstNumber: '',
    panNumber: '',
    businessAddress: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/seller/profile');
      const profileData = response.data;
      setProfile(profileData);
      
      setFormData({
        businessName: profileData.businessName || '',
        gstNumber: profileData.gstNumber || '',
        panNumber: profileData.panNumber || '',
        businessAddress: profileData.businessAddress || '',
        firstName: profileData.user.firstName || '',
        lastName: profileData.user.lastName || '',
        email: profileData.user.email || '',
        phone: profileData.user.phone || '',
        address: profileData.user.address || '',
        pincode: profileData.user.pincode || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const profileData = {
        businessName: formData.businessName,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        businessAddress: formData.businessAddress,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };

      await api.put('/seller/profile', profileData);
      setSuccess(true);
      fetchProfile(); // Refresh profile data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    // Check file size (max 2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit');
      return;
    }

    // Check file type (PDF only)
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', 'BUSINESS_LICENSE'); // Default type

      await api.post('/seller/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setSelectedFile(null);
      fetchProfile(); // Refresh profile to show new document
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await api.delete(`/seller/documents/${documentId}`);
      setSuccess(true);
      fetchProfile(); // Refresh profile to remove deleted document
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seller Profile</h1>
        <p className="text-muted-foreground">
          Manage your seller information and documents
        </p>
      </div>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
          <CardDescription>
            Your current seller account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">
                {getStatusBadge(profile?.status || 'PENDING')}
              </p>
            </div>
            {profile?.status === 'REJECTED' && profile.rejectionReason && (
              <div>
                <p className="font-medium text-destructive">Rejection Reason</p>
                <p className="text-sm text-destructive">{profile.rejectionReason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Update your business details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4">
                <AlertDescription>
                  Profile updated successfully!
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium">
                  Business Name *
                </label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter business name"
                  required
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="gstNumber" className="text-sm font-medium">
                    GST Number
                  </label>
                  <Input
                    id="gstNumber"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="Enter GST number"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="panNumber" className="text-sm font-medium">
                    PAN Number
                  </label>
                  <Input
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="Enter PAN number"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="businessAddress" className="text-sm font-medium">
                  Business Address
                </label>
                <Textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="Enter business address"
                  rows={3}
                  disabled={saving}
                />
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Update your contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name *
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name *
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Management
          </CardTitle>
          <CardDescription>
            Upload and manage your business documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload Document */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Upload Document</p>
              <p className="text-xs text-muted-foreground mb-4">
                PDF files only, max 2MB
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="max-w-xs"
                />
                <Button 
                  onClick={handleUploadDocument}
                  disabled={!selectedFile}
                >
                  Upload
                </Button>
              </div>
            </div>

            {/* Uploaded Documents */}
            {profile?.documents && profile.documents.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Uploaded Documents</h3>
                <div className="space-y-2">
                  {profile.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{document.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {(document.fileSize / 1024).toFixed(1)} KB • {new Date(document.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}