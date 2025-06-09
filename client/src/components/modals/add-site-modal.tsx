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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertSiteSchema, type Site } from "@shared/schema";

const formSchema = insertSiteSchema.omit({ siteCode: true }).extend({
  excludedVerticals: z.array(z.string()).optional(),
  flowConfig: z.object({
    type: z.enum(["progressive", "front_loaded", "minimal"]),
    questionsPerAd: z.number().min(1).max(5),
    maxQuestions: z.number().min(1).max(20),
    maxAds: z.number().min(1).max(10),
    requireEmail: z.boolean()
  }).optional()
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
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (editingSite) {
        return await apiRequest("PUT", `/api/sites/${editingSite.id}`, data);
      } else {
        return await apiRequest("POST", "/api/sites", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({
        title: editingSite ? "Site updated" : "Site created",
        description: `Site has been ${editingSite ? "updated" : "created"} successfully.`,
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editingSite ? "update" : "create"} site.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
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
                  <FormLabel>Site Vertical</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vertical" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {verticals.map((vertical) => (
                        <SelectItem key={vertical} value={vertical} className="capitalize">
                          {vertical}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-base">Excluded Campaign Verticals</FormLabel>
              <p className="text-sm text-slate-500 mb-3">
                Select verticals that should NOT be shown on this site
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {verticals.map((vertical) => (
                  <div key={vertical} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exclude-${vertical}`}
                      checked={(form.watch("excludedVerticals") || []).includes(vertical)}
                      onCheckedChange={(checked) => handleVerticalToggle(vertical, checked as boolean)}
                    />
                    <label
                      htmlFor={`exclude-${vertical}`}
                      className="text-sm text-slate-700 capitalize cursor-pointer"
                    >
                      {vertical}
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
                      Enable this site for ad serving
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

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editingSite ? "Update Site" : "Create Site"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
