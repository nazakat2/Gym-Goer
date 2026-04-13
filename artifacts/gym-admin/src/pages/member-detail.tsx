import { useGetMember } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, MapPin, Phone, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MemberDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: member, isLoading } = useGetMember(Number(id));

  if (isLoading) return <div>Loading member details...</div>;
  if (!member) return <div>Member not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/members")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
        </div>
        <Button variant="outline">Edit Member</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground overflow-hidden">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{member.name}</h2>
                  <Badge variant={member.status === "active" ? "default" : "destructive"}>
                    {member.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {member.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> {member.cnic}
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-4 w-4" /> {member.address || "No address provided"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Membership Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Plan Type</span>
                      <span className="font-medium capitalize">{member.plan}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-medium">{format(new Date(member.planStartDate), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Expiry Date</span>
                      <span className="font-medium">{format(new Date(member.planExpiryDate), "MMM d, yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="attendance">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">Attendance history will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="measurements">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">Measurement history will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="invoices">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-8">Invoice history will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" /> Renew Membership
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" /> Add Measurement
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Activity, Receipt } from "lucide-react";
