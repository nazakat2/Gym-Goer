import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMember } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Upload, X } from "lucide-react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  cnic: z.string().min(1, "CNIC is required"),
  address: z.string().optional(),
  plan: z.enum(["monthly", "quarterly", "yearly", "weekly", "daily"]),
  planStartDate: z.string().min(1, "Start date is required"),
  photoUrl: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function AddMember() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMember = useCreateMember();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      plan: "monthly",
      planStartDate: new Date().toISOString().split("T")[0],
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoError("Image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setValue("photoUrl", base64);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoError(null);
    setValue("photoUrl", undefined);
  };

  const onSubmit = async (data: MemberFormValues) => {
    try {
      await createMember.mutateAsync({ data: {
        name: data.name,
        phone: data.phone,
        cnic: data.cnic,
        address: data.address,
        plan: data.plan as any,
        planStartDate: data.planStartDate,
        photoUrl: data.photoUrl || null,
      }});
      toast({ title: "Member created successfully" });
      setLocation("/members");
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to create member";
      toast({ title: msg, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/members")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add New Member</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Member Details</CardTitle>
            <CardDescription>Enter the new member's personal and plan information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register("name")} placeholder="e.g. Ahmed Khan" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...register("phone")} placeholder="03XX-XXXXXXX" />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input id="cnic" {...register("cnic")} placeholder="XXXXX-XXXXXXX-X" />
                    {errors.cnic && <p className="text-sm text-destructive">{errors.cnic.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" {...register("address")} placeholder="Street, City" />
                  {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Membership Plan</Label>
                    <Select
                      onValueChange={(val) => setValue("plan", val as any)}
                      defaultValue={watch("plan")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.plan && <p className="text-sm text-destructive">{errors.plan.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planStartDate">Start Date</Label>
                    <Input id="planStartDate" type="date" {...register("planStartDate")} />
                    {errors.planStartDate && <p className="text-sm text-destructive">{errors.planStartDate.message}</p>}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-2">
                <Label>Profile Photo</Label>
                <div className="relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center h-64 overflow-hidden">
                  {photoPreview ? (
                    <>
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload photo</p>
                      <p className="text-xs text-muted-foreground mt-1">Max 5 MB</p>
                    </>
                  )}
                  {!photoPreview && (
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handlePhotoUpload}
                    />
                  )}
                </div>
                {photoError && (
                  <p className="text-sm text-destructive">{photoError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Member"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
