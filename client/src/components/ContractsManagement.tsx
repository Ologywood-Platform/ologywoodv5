// DISABLED: contracts router not available
import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { FileText } from 'lucide-react';

interface ContractsManagementProps {
  bookingId?: number;
}

export function ContractsManagement({ bookingId }: ContractsManagementProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Contracts Management</h2>
      </div>
      <p className="text-gray-600 mb-4">
        Contract management features coming soon.
      </p>
      <Button disabled>
        View Contracts (Coming Soon)
      </Button>
    </Card>
  );
}

export default ContractsManagement;
