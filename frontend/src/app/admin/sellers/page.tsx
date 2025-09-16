'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter 
} from 'lucide-react';
import api from '@/lib/api';
import { Seller } from '@/lib/types';

export default function SellerManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSellers();
  }, [currentPage]);

  useEffect(() => {
    filterSellers();
  }, [sellers, searchTerm, statusFilter]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/sellers?page=${currentPage}&limit=10`);
      setSellers(response.data.sellers || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSellers = () => {
    let filtered = sellers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(seller => 
        seller.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seller.user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (seller.user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(seller => seller.status === statusFilter);
    }

    setFilteredSellers(filtered);
  };

  const handleApproveSeller = async (sellerId: string) => {
    try {
      await api.post(`/admin/sellers/${sellerId}/approve`);
      // Refresh the list
      fetchSellers();
    } catch (error) {
      console.error('Error approving seller:', error);
    }
  };

  const handleRejectSeller = async (sellerId: string, reason?: string) => {
    try {
      await api.post(`/admin/sellers/${sellerId}/reject`, { rejectionReason: reason });
      // Refresh the list
      fetchSellers();
    } catch (error) {
      console.error('Error rejecting seller:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Seller Management</h1>
          <p className="text-muted-foreground">
            Manage seller accounts and approve new applications
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sellers..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sellers</CardDescription>
            <CardTitle className="text-4xl">42</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-4xl">8</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sellers</CardDescription>
            <CardTitle className="text-4xl">34</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sellers</CardTitle>
          <CardDescription>
            Manage seller accounts and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div className="font-medium">{seller.businessName}</div>
                        <div className="text-sm text-muted-foreground">
                          {seller.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {seller.user.profile?.firstName} {seller.user.profile?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {seller.user.profile?.phone}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(seller.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {seller.documents.length} documents
                        </Badge>
                      </TableCell>
                      <TableCell>
                     {seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {seller.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectSeller(seller.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApproveSeller(seller.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedSeller(seller)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Seller Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about {seller.businessName}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedSeller && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium">Business Information</h4>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Name:</strong> {selectedSeller.businessName}
                                      </p>
                                      {selectedSeller.gstNumber && (
                                        <p className="text-sm text-muted-foreground">
                                          <strong>GST:</strong> {selectedSeller.gstNumber}
                                        </p>
                                      )}
                                      {selectedSeller.panNumber && (
                                        <p className="text-sm text-muted-foreground">
                                          <strong>PAN:</strong> {selectedSeller.panNumber}
                                        </p>
                                      )}
                                      {selectedSeller.businessAddress && (
                                        <p className="text-sm text-muted-foreground">
                                          <strong>Address:</strong> {selectedSeller.businessAddress}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">Contact Information</h4>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Email:</strong> {selectedSeller.user.email}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Name:</strong> {selectedSeller.user.profile?.firstName} {selectedSeller.user.profile?.lastName}
                                      </p>
                                      {selectedSeller.user.profile?.phone && (
                                        <p className="text-sm text-muted-foreground">
                                          <strong>Phone:</strong> {selectedSeller.user.profile.phone}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Documents</h4>
                                    <div className="space-y-2">
                                      {selectedSeller.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                                          <div>
                                            <p className="font-medium">{doc.fileName}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(1)} KB
                                            </p>
                                          </div>
                                          <Button variant="outline" size="sm">
                                            View
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {selectedSeller.status === 'REJECTED' && selectedSeller.rejectionReason && (
                                    <div>
                                      <h4 className="font-medium mb-2">Rejection Reason</h4>
                                      <p className="text-sm text-destructive">
                                        {selectedSeller.rejectionReason}
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex justify-end gap-2">
                                    {selectedSeller.status === 'PENDING' && (
                                      <>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleRejectSeller(selectedSeller.id)}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Reject
                                        </Button>
                                        <Button
                                          onClick={() => handleApproveSeller(selectedSeller.id)}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}