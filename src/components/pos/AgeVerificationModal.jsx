import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Scan } from "lucide-react";
import { AgeVerification } from "@/api/entities";

export default function AgeVerificationModal({ onVerified, onClose }) {
  const [verificationData, setVerificationData] = useState({
    birthdate: "",
    idType: "",
    verificationMethod: "manual_entry"
  });
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBirthdateChange = (birthdate) => {
    setVerificationData({...verificationData, birthdate});
    
    if (birthdate) {
      const today = new Date();
      const birth = new Date(birthdate);
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        setCalculatedAge(age - 1);
      } else {
        setCalculatedAge(age);
      }
    } else {
      setCalculatedAge(null);
    }
  };

  const handleVerify = async () => {
    if (!verificationData.birthdate || !verificationData.idType) {
      alert("Please fill in all required fields");
      return;
    }

    if (calculatedAge < 21) {
      alert("Customer is under 21 and cannot purchase age-restricted items");
      return;
    }

    setIsProcessing(true);

    try {
      await AgeVerification.create({
        customer_birthdate: verificationData.birthdate,
        id_type: verificationData.idType,
        verification_method: verificationData.verificationMethod,
        verified_age: calculatedAge
      });

      onVerified();
    } catch (error) {
      console.error("Age verification failed:", error);
      alert("Verification failed. Please try again.");
    }

    setIsProcessing(false);
  };

  const isValid = calculatedAge !== null && calculatedAge >= 21;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Age Verification Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              This transaction contains age-restricted items. Customer must be 21+ years old.
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="birthdate">Customer Birth Date</Label>
              <Input
                id="birthdate"
                type="date"
                value={verificationData.birthdate}
                onChange={(e) => handleBirthdateChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              {calculatedAge !== null && (
                <div className={`text-sm mt-1 ${calculatedAge >= 21 ? 'text-green-600' : 'text-red-600'}`}>
                  Age: {calculatedAge} years old
                  {calculatedAge >= 21 ? (
                    <CheckCircle2 className="w-4 h-4 inline ml-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 inline ml-2" />
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="idType">ID Type</Label>
              <Select 
                value={verificationData.idType} 
                onValueChange={(value) => setVerificationData({...verificationData, idType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="state_id">State ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="military_id">Military ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Verification Method</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant={verificationData.verificationMethod === "manual_entry" ? "default" : "outline"}
                  onClick={() => setVerificationData({...verificationData, verificationMethod: "manual_entry"})}
                >
                  Manual Entry
                </Button>
                <Button
                  size="sm"
                  variant={verificationData.verificationMethod === "id_scanner" ? "default" : "outline"}
                  onClick={() => setVerificationData({...verificationData, verificationMethod: "id_scanner"})}
                >
                  <Scan className="w-3 h-3 mr-1" />
                  ID Scanner
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel Transaction
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!isValid || isProcessing}
              className={isValid ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isProcessing ? "Verifying..." : "Verify Age"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}