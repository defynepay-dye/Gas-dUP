
import React, { useState, useEffect, useCallback } from 'react';
import { InvoiceAudit } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  TrendingDown,
  Eye,
  Download
} from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

export default function InvoiceAuditDashboard({ locationId }) {
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState(null);

  const loadAudits = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await InvoiceAudit.filter(
        locationId ? { location_id: locationId } : {},
        '-created_date',
        50
      );
      setAudits(data);
    } catch (error) {
      console.error('Error loading invoice audits:', error);
    }
    setIsLoading(false);
  }, [locationId]);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const runAIAudit = async (invoiceData) => {
    try {
      // Use AI to audit invoice for discrepancies
      const auditResults = await InvokeLLM({
        prompt: `Perform a comprehensive audit of this invoice data. Analyze for:
        1. Price variances against expected costs
        2. Quantity discrepancies
        3. Duplicate charges
        4. Missing items that were ordered
        5. Mathematical errors
        6. Suspicious patterns
        
        Invoice Data: ${JSON.stringify(invoiceData)}`,
        response_json_schema: {
          type: "object",
          properties: {
            price_variances: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  upc_code: { type: "string" },
                  expected_price: { type: "number" },
                  invoiced_price: { type: "number" },
                  variance_amount: { type: "number" },
                  variance_percentage: { type: "number" }
                }
              }
            },
            total_savings_identified: { type: "number" },
            confidence: { type: "number" },
            recommendations: { type: "string" }
          }
        }
      });

      // Save audit results
      await InvoiceAudit.create({
        ...invoiceData,
        ai_audit_results: auditResults,
        total_savings_identified: auditResults.total_savings_identified,
        audit_confidence: auditResults.confidence,
        status: 'pending_review'
      });

      loadAudits();
    } catch (error) {
      console.error('Error running AI audit:', error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending_review: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      disputed: 'bg-red-100 text-red-800',
      resolved: 'bg-blue-100 text-blue-800'
    };
    return <Badge className={colors[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const totalSavingsIdentified = audits.reduce((sum, audit) => sum + (audit.total_savings_identified || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            AI Invoice Auditing
          </h2>
          <p className="text-gray-500">Automated invoice verification and cost analysis</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Savings Found</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalSavingsIdentified.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Invoices Audited</p>
                <p className="text-2xl font-bold">{audits.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Issues Found</p>
                <p className="text-2xl font-bold text-red-600">
                  {audits.filter(a => a.total_savings_identified > 0).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${audits.length > 0 ? (totalSavingsIdentified / audits.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice Audit Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading invoice audits...</div>
          ) : audits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No invoice audits yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {audits.map((audit) => (
                <div key={audit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">Invoice #{audit.invoice_number}</h4>
                        {getStatusBadge(audit.status)}
                        {audit.total_savings_identified > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            ${audit.total_savings_identified.toFixed(2)} Issues Found
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {audit.supplier_name} • {new Date(audit.invoice_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${audit.invoice_total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {((audit.audit_confidence || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {audit.ai_audit_results && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Price Variances</p>
                        <p className="font-semibold text-red-600">
                          {audit.ai_audit_results.price_variances?.length || 0} items
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quantity Issues</p>
                        <p className="font-semibold text-orange-600">
                          {audit.ai_audit_results.quantity_discrepancies?.length || 0} items
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duplicate Charges</p>
                        <p className="font-semibold text-purple-600">
                          {audit.ai_audit_results.duplicate_charges?.length || 0} items
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Audited {new Date(audit.created_date).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {audit.status === 'pending_review' && (
                        <>
                          <Button size="sm" variant="outline">
                            Dispute
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
