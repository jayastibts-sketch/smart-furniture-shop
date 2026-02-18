import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, MapPin, Home, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SelectedAddress } from "@/pages/Checkout";
import { cn } from "@/lib/utils";

interface AddressStepProps {
  selectedAddress: SelectedAddress | null;
  onSelect: (address: SelectedAddress) => void;
}

interface SavedAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label: string;
  is_default: boolean;
}

export function AddressStep({ selectedAddress, onSelect }: AddressStepProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(selectedAddress?.id || null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    label: "Home",
  });

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      
      if (data && data.length > 0 && !selectedId) {
        const defaultAddr = data.find((a) => a.is_default) || data[0];
        setSelectedId(defaultAddr.id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          ...formData,
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Address saved successfully");
      setAddresses([...addresses, data]);
      setSelectedId(data.id);
      setShowForm(false);
      setFormData({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        label: "Home",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    const selected = addresses.find((a) => a.id === selectedId);
    if (selected) {
      onSelect({
        id: selected.id,
        full_name: selected.full_name,
        phone: selected.phone,
        address_line1: selected.address_line1,
        address_line2: selected.address_line2 || undefined,
        city: selected.city,
        state: selected.state,
        postal_code: selected.postal_code,
        country: selected.country,
        label: selected.label,
      });
    }
  };

  const getLabelIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "work":
      case "office":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card variant="elevated" className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="font-display text-xl font-semibold">
            Delivery Address
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="House/Flat No., Building Name"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="Street, Landmark"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="label">Address Label</Label>
              <div className="flex gap-2 mt-1">
                {["Home", "Work", "Other"].map((label) => (
                  <Button
                    key={label}
                    type="button"
                    variant={formData.label === label ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, label })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Address
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            No saved addresses. Add a delivery address to continue.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>
      ) : (
        <>
          <RadioGroup
            value={selectedId || ""}
            onValueChange={setSelectedId}
            className="space-y-3"
          >
            {addresses.map((address) => (
              <label
                key={address.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedId === address.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value={address.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getLabelIcon(address.label)}
                    <span className="font-medium">{address.label}</span>
                    {address.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="font-medium">{address.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Phone: {address.phone}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            onClick={handleContinue}
            disabled={!selectedId}
          >
            Continue to Payment
          </Button>
        </>
      )}
    </Card>
  );
}
