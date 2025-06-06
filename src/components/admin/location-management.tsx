
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Location } from '@/lib/types';
import { getLocations, deleteLocation as deleteLocationData } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const LocationFormDialog = React.lazy(() => 
  import('./location-form-dialog').then(module => ({ default: module.LocationFormDialog }))
);

export function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLocations = useCallback(async () => {
    console.log("[LocationManagement] fetchLocations: Fetching...");
    setIsLoading(true);
    try {
      const fetchedLocations = await getLocations();
      setLocations(fetchedLocations);
      console.log("[LocationManagement] fetchLocations: Success, fetched locations:", fetchedLocations.length);
    } catch (error) {
      console.error("[LocationManagement] fetchLocations: Error fetching locations:", error);
      toast({ title: "Error", description: "Failed to fetch locations.", variant: "destructive" });
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    fetchLocations();
  }, [fetchLocations]);

  const handleAddLocation = () => {
    setSelectedLocation(undefined);
    setIsFormOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    setLocationToDelete(locationId);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (locationToDelete) {
      setIsLoading(true); 
      try {
        const success = await deleteLocationData(locationToDelete);
        if (success) {
          toast({ title: "Location Deleted", description: "The location has been successfully deleted." });
          fetchLocations(); 
        } else {
          toast({ title: "Error Deleting Location", description: "Failed to delete location. It might have rooms associated with it or another error occurred.", variant: "destructive" });
        }
      } catch (error) {
        console.error("[LocationManagement] confirmDelete: Error deleting location:", error);
        toast({ title: "Error", description: "An unexpected error occurred while deleting the location.", variant: "destructive" });
      } finally {
        setLocationToDelete(null);
        setIsLoading(false);
        setIsAlertOpen(false);
      }
    } else {
     setIsAlertOpen(false);
    }
  };

  const handleFormClose = (updated: boolean) => {
    setIsFormOpen(false);
    setSelectedLocation(undefined);
    if (updated) {
      fetchLocations();
    }
  };

  if (!isMounted) { 
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing...</span>
      </div>
    );
  }
  
  if (isLoading && locations.length === 0) { // Show main loader only if truly loading initial data
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading locations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Manage Locations</h2>
        <Button onClick={handleAddLocation}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Location
        </Button>
      </div>

      {isLoading && locations.length > 0 && ( // Subtle loader for re-fetches when data already exists
        <div className="flex items-center justify-start py-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Refreshing locations...</span>
        </div>
      )}

      {!isLoading && locations.length === 0 ? (
         <p className="text-muted-foreground text-center py-4">No locations found. Add a new location to get started.</p>
      ) : locations.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{location.id}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditLocation(location)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteLocation(location.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null } {/* Render nothing if !isLoading and locations.length is 0 to avoid flicker before empty message shows */}

      {isMounted && (
        <React.Suspense fallback={<div>Loading form...</div>}>
            <LocationFormDialog
            isOpen={isFormOpen}
            onClose={handleFormClose}
            location={selectedLocation}
            />
        </React.Suspense>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the location. 
              Ensure no rooms are associated with this location before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setLocationToDelete(null); setIsAlertOpen(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isLoading}>
                {isLoading && locationToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
