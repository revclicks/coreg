import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCampaignSchema, type Campaign, type Question } from "@shared/schema";

const formSchema = insertCampaignSchema.extend({
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  targeting: z.any().optional(),
  dayParting: z.any().optional(),
});

interface AddCampaignModalProps {
  open: boolean;
  onClose: () => void;
  editingCampaign?: Campaign | null;
}

export default function AddCampaignModal({ open, onClose, editingCampaign }: AddCampaignModalProps) {
  const { toast } = useToast();

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingCampaign?.name || "",
      vertical: editingCampaign?.vertical || "",
      ageMin: editingCampaign?.ageMin || undefined,
      ageMax: editingCampaign?.ageMax || undefined,
      gender: editingCampaign?.gender || "all",
      states: editingCampaign?.states || "",
      device: editingCampaign?.device || "all",
      convertOnce: editingCampaign?.convertOnce || false,
      active: editingCampaign?.active ?? true,
      imageUrl: editingCampaign?.imageUrl || "",
      frequency: editingCampaign?.frequency || 1,
      url: editingCampaign?.url || "",
      cpcBid: editingCampaign?.cpcBid || "0.00",
      targeting: editingCampaign?.targeting || {},
      dayParting: editingCampaign?.dayParting || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        startTime: "00:00",
        endTime: "23:59",
      },
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (editingCampaign) {
        return await apiRequest("PUT", `/api/campaigns/${editingCampaign.id}`, data);
      } else {
        return await apiRequest("POST", "/api/campaigns", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: editingCampaign ? "Campaign updated" : "Campaign created",
        description: `Campaign has been ${editingCampaign ? "updated" : "created"} successfully.`,
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editingCampaign ? "update" : "create"} campaign.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? "Edit Campaign" : "Add New Campaign"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vertical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vertical</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vertical" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="energy">Energy</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="ageMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="18"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="65"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="device"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Devices</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="states"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State Targeting</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter states (e.g., CA, NY, TX) or leave blank for all states"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="cpcBid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPC Bid ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Frequency (per session)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com?utm_source=coreg&age={age}&firstname={firstname}"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-slate-500">
                    Available variables: {"{age}"}, {"{firstname}"}, {"{lastname}"}, {"{gender}"}, {"{state}"}. ckid= will be auto-appended.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-base">Question Targeting</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {questions?.map((question) => (
                  <div key={question.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`question-${question.id}`}
                      checked={form.watch("targeting")?.[`question_${question.id}`] || false}
                      onCheckedChange={(checked) => {
                        const targeting = form.getValues("targeting") || {};
                        form.setValue("targeting", {
                          ...targeting,
                          [`question_${question.id}`]: checked,
                        });
                      }}
                    />
                    <label
                      htmlFor={`question-${question.id}`}
                      className="text-sm text-slate-700 cursor-pointer"
                    >
                      {question.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel className="text-base">Active Days</FormLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={form.watch("dayParting")?.[day] || false}
                        onCheckedChange={(checked) => {
                          const dayParting = form.getValues("dayParting") || {};
                          form.setValue("dayParting", {
                            ...dayParting,
                            [day]: checked,
                          });
                        }}
                      />
                      <label htmlFor={day} className="text-sm text-slate-700 capitalize cursor-pointer">
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <FormLabel className="text-base">Active Hours</FormLabel>
                <div className="space-y-2 mt-2">
                  <div>
                    <FormLabel className="text-xs text-slate-500">Start Time</FormLabel>
                    <Input
                      type="time"
                      value={form.watch("dayParting")?.startTime || "00:00"}
                      onChange={(e) => {
                        const dayParting = form.getValues("dayParting") || {};
                        form.setValue("dayParting", {
                          ...dayParting,
                          startTime: e.target.value,
                        });
                      }}
                    />
                  </div>
                  <div>
                    <FormLabel className="text-xs text-slate-500">End Time</FormLabel>
                    <Input
                      type="time"
                      value={form.watch("dayParting")?.endTime || "23:59"}
                      onChange={(e) => {
                        const dayParting = form.getValues("dayParting") || {};
                        form.setValue("dayParting", {
                          ...dayParting,
                          endTime: e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="convertOnce"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Convert Once</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        User can only convert once on this campaign
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable this campaign for ad serving
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editingCampaign ? "Update Campaign" : "Create Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
