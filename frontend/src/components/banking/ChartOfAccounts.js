import React, { useState, useEffect } from "react";
import { bankingService as accountService, bankingUtils } from "../../services/bankingService";
import { useCompany } from "../../contexts/CompanyContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  Search, 
  Plus, 
  CreditCard, 
  Edit,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw
} from "lucide-react";

const ChartOfAccounts = () => {
  const { currentCompany } = useCompany();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load accounts data
  useEffect(() => {
    if (currentCompany?.id) {
      loadAccounts();
    }
  }, [currentCompany?.id]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accountsData = await accountService.getAccounts(currentCompany.id, {
        limit: 1000, // Get all accounts
        is_active: showInactive ? undefined : true,
        search: searchTerm || undefined,
        account_type: filterType === "all" ? undefined : filterType
      });
      
      setAccounts(accountsData.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  // Handle search and filter changes
  useEffect(() => {
    if (currentCompany?.id) {
      const delayedSearch = setTimeout(() => {
        loadAccounts();
      }, 500);
      
      return () => clearTimeout(delayedSearch);
    }
  }, [searchTerm, filterType, showInactive]);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchTerm === "" || 
                         account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (account.number && account.number.includes(searchTerm));
    const matchesType = filterType === "all" || account.type.toLowerCase() === filterType.toLowerCase();
    const matchesActive = showInactive || account.is_active;
    return matchesSearch && matchesType && matchesActive;
  });

  const getTypeColor = (type) => {
    return bankingUtils.getAccountTypeColor(type);
  };

  const formatBalance = (balance) => {
    return bankingUtils.formatCurrency(balance);
  };

  // Calculate account statistics
  const accountStats = {
    bankAccounts: accounts.filter(account => account.type === "Bank").length,
    totalBankBalance: accounts.filter(account => account.type === "Bank").reduce((sum, account) => sum + (account.balance || 0), 0),
    totalAssets: accounts.filter(account => account.type === "Fixed Asset").reduce((sum, account) => sum + (account.balance || 0), 0),
    totalLiabilities: accounts.filter(account => account.type === "Accounts Payable").reduce((sum, account) => sum + (account.balance || 0), 0),
    totalAccounts: accounts.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Please select a company to view accounts</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600">Manage your company's accounts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Customize Columns
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Chart of Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="accounts receivable">Accounts Receivable</SelectItem>
                <SelectItem value="fixed asset">Fixed Asset</SelectItem>
                <SelectItem value="accounts payable">Accounts Payable</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showInactive ? "Hide Inactive" : "Show Inactive"}
            </Button>
          </div>

          {/* Accounts Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(account.type)}>
                        {account.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.number}</TableCell>
                    <TableCell className={`font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatBalance(account.balance)}
                    </TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No accounts found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {accountStats.bankAccounts}
            </div>
            <p className="text-sm text-gray-600">Bank Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {bankingUtils.formatCurrency(accountStats.totalBankBalance)}
            </div>
            <p className="text-sm text-gray-600">Total Bank Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {bankingUtils.formatCurrency(accountStats.totalAssets)}
            </div>
            <p className="text-sm text-gray-600">Total Assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {accountStats.totalAccounts}
            </div>
            <p className="text-sm text-gray-600">Total Accounts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChartOfAccounts;