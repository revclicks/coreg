import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Site } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  domain: z.string().min(1, "Domain is required"),
  vertical: z.string().min(1, "Vertical is required"),
  excludedVerticals: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  flowConfig: z.object({
    type: z.enum(["progressive", "front_loaded", "minimal"]),
    questionsPerAd: z.number().min(1).max(5),
    maxQuestions: z.number().min(1).max(20),
    maxAds: z.number().min(1).max(10),
    requireEmail: z.boolean()
  })
});

interface AddSiteModalProps {
  open: boolean;
  onClose: () => void;
  editingSite?: Site | null;
}

const verticals = ["health", "finance", "technology", "energy", "travel", "adult", "gambling"];

export default function AddSiteModal({ open, onClose, editingSite }: AddSiteModalProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingSite?.name || "",
      domain: editingSite?.domain || "",
      vertical: editingSite?.vertical || "",
      excludedVerticals: (editingSite?.excludedVerticals as string[]) || [],
      active: editingSite?.active ?? true,
      flowConfig: editingSite?.flowConfig || {
        type: "progressive",
        questionsPerAd: 2,
        maxQuestions: 6,
        maxAds: 3,
        requireEmail: true
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      console.log("🚀 Submitting site data:", data);
      
      const url = editingSite ? `/api/sites/${editingSite.id}` : "/api/sites";
      const method = editingSite ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Site submission error:", errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Site submission successful:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 Site mutation success callback:", data);
      
      // Invalidate all sites-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.removeQueries({ queryKey: ["/api/sites"] });
      queryClient.refetchQueries({ queryKey: ["/api/sites"] });
      
      toast({
        title: editingSite ? "Site updated" : "Site created",
        description: `Site has been ${editingSite ? "updated" : "created"} successfully.`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error("💥 Site mutation error callback:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingSite ? "update" : "create"} site. ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("📝 Form submit called with data:", data);
    console.log("📋 Form errors:", form.formState.errors);
    mutation.mutate(data);
  };

  const handleVerticalToggle = (vertical: string, checked: boolean) => {
    const currentExcluded = form.getValues("excludedVerticals") || [];
    if (checked) {
      form.setValue("excludedVerticals", [...currentExcluded, vertical]);
    } else {
      form.setValue("excludedVerticals", currentExcluded.filter(v => v !== vertical));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingSite ? "Edit Site" : "Add New Site"}
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
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter site name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vertical"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Vertical</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vertical" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {verticals.map((vertical) => (
                        <SelectItem key={vertical} value={vertical}>
                          {vertical.charAt(0).toUpperCase() + vertical.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Excluded Verticals</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {verticals.map((vertical) => (
                  <div key={vertical} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exclude-${vertical}`}
                      checked={form.watch("excludedVerticals")?.includes(vertical) || false}
                      onCheckedChange={(checked: boolean) => handleVerticalToggle(vertical, checked)}
                    />
                    <label
                      htmlFor={`exclude-${vertical}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {vertical.charAt(0).toUpperCase() + vertical.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this site for campaign targeting
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : editingSite ? "Update Site" : "Create Site"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}