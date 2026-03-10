
import React, { useState, useEffect, useRef } from 'react';
import { TicketEntry } from '../types';
import toast from 'react-hot-toast';
import ProjectSelect from '../components/ProjectSelect';
import { useAllProjects, useProjectRoles } from '../hooks/queries/useProjectsQueries';
import { useTickets, useTicketTypes, useTicketStatuses, useWeeks } from '../hooks/queries/useTicketsQueries';
import { useUserProfile } from '../hooks/queries/useUserQueries';
import { useBulkCreateTickets } from '../hooks/mutations/useTicketsMutations';
import { ExistingTicketsModal } from '../components/modal';
import { ticketsService, type BulkTicketItem } from '../services/tickets.service';
import FilterDialog from '../components/FilterDialog';

const DEFAULT_TYPE = 'Bug Fix';
const FALLBACK_TICKET_TYPES = ['Feature', 'Bug Fix', 'Refactor', 'Hotfix', 'Research'];
const DEFAULT_JIRA_BASE_URL = 'https://dzhintl.atlassian.net/browse';

const INITIAL_FINAL_ENTRIES: TicketEntry[] = [
    { id: '1', ticketId: 'ODC-120', projectName: 'Alpha Banking Portal', type: 'Feature', roles: ['Senior Dev'], status: 'InQA', timestamp: '2023-10-01', week: 1, month: 10, length: 5 },
    { id: '2', ticketId: 'ODC-341', projectName: 'Mobile App Refresh', type: 'Bug Fix', roles: ['QA Lead'], status: 'Closed', timestamp: '2023-10-02', week: 2, month: 10, length: 3 },
];

const LogTickets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'draft' | 'final'>('draft');
  const [draftEntries, setDraftEntries] = useState<TicketEntry[]>([]);
  const [finalEntries, setFinalEntries] = useState<TicketEntry[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{
    ticketId?: boolean;
    project?: boolean;
    roles?: boolean;
  }>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftMonth, setDraftMonth] = useState<number | null>(null);
  const [existingTickets, setExistingTickets] = useState<Array<{
    ticketId: string;
    ticket: BulkTicketItem;
  }>>([]);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<any>(null);
  const [alreadyExistTickets, setAlreadyExistTickets] = useState<Array<{
    ticketId: string;
    entry: TicketEntry;
  }>>([]);
  const [showAlreadyExistModal, setShowAlreadyExistModal] = useState(false);
  const [isUpdatingAlreadyExist, setIsUpdatingAlreadyExist] = useState(false);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());

  // Filter states for Final tab
  const [filters, setFilters] = useState({
    search: '',
    ticketTypeId: '',
    ticketStatusId: '',
    sortBy: '',
    sortOrder: '',
    weeks: [] as number[],
    month: 0,
  });

  // Fetch roles from API
  const { data: rolesData = [], isLoading: isLoadingRoles } = useProjectRoles();
  const { data: allProjectsData } = useAllProjects();
  const { data: ticketTypes = [], isLoading: isLoadingTicketTypes } = useTicketTypes();
  const { data: ticketStatuses = [], isLoading: isLoadingTicketStatuses } = useTicketStatuses();
  const { data: weeks = [] } = useWeeks(draftMonth);
  const { data: userProfile } = useUserProfile();
  const { mutateAsync: submitTicketsBulk, isPending: isSubmittingFinal } = useBulkCreateTickets();

  // For Final tab: Fetch my own tickets with specific project IDs
  const [isLoadingFinalTab, setIsLoadingFinalTab] = useState(false);
  const [finalTabMyTickets, setFinalTabMyTickets] = useState<TicketEntry[]>([]);

  const draftTypeOptions = ticketTypes.length > 0
    ? ticketTypes.map((ticketType) => ticketType.name || ticketType.code).filter(Boolean)
    : FALLBACK_TICKET_TYPES;
  const draftStatusOptions = Array.from(
    new Set(
      ticketStatuses
        .map((ticketStatus) => ticketStatus.name || ticketStatus.code)
        .filter(Boolean),
    ),
  ) as string[];
  const defaultDraftStatus = draftStatusOptions[0] || '';

  const findRoleBySelectedValue = (selectedValue: string) => {
    return rolesData.find(
      (role) =>
        role.roleUuid === selectedValue ||
        role.id === selectedValue ||
        role.name === selectedValue,
    );
  };

  const getRoleSubmitId = (selectedValue: string) => {
    const role = findRoleBySelectedValue(selectedValue);
    return role?.roleUuid || role?.id || selectedValue;
  };

  const getTicketTypeIdByName = (typeName: string) => {
    const ticketType = ticketTypes.find(
      (item) => item.name === typeName || item.code === typeName,
    );
    return ticketType?.id || '';
  };

  const getDefaultBugTicketTypeId = () => {
    // Try to find Bug ticket type
    const bugType = ticketTypes.find(
      (item) => item.name?.toLowerCase() === 'bug' || item.code?.toLowerCase() === 'bug' || item.code === 'BUG',
    );
    return bugType?.id || '';
  };

  const getTicketStatusIdByName = (statusName: string) => {
    const ticketStatus = ticketStatuses.find(
      (item) => item.name === statusName || item.code === statusName,
    );
    return ticketStatus?.id || '';
  };

  const buildTicketLink = (ticketId: string) => {
    return `${DEFAULT_JIRA_BASE_URL}/${ticketId}`;
  };

  const resolveProjectId = (entry: TicketEntry) => {
    if (entry.projectId) return entry.projectId;

    const projects = allProjectsData?.data || [];
    const matchedProject = projects.find(
      (project) => project.name?.trim().toLowerCase() === entry.projectName?.trim().toLowerCase(),
    );

    if (matchedProject?.id) {
      return matchedProject.id;
    }

    if (
      selectedProjectId &&
      selectedProjectName &&
      selectedProjectName.trim().toLowerCase() === entry.projectName?.trim().toLowerCase()
    ) {
      return selectedProjectId;
    }

    return '';
  };

  const isValidUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  const resolveEmployeeId = () => {
    const profile = userProfile as any;
    const candidates = [
      profile?.employeeId,
      profile?.employee_id,
      profile?.id,
      profile?.data?.employeeId,
      profile?.data?.employee_id,
      profile?.data?.id,
    ];

    // Find the first valid UUID
    for (const candidate of candidates) {
      if (candidate && isValidUUID(String(candidate))) {
        return String(candidate);
      }
    }

    return '';
  };

  // Fetch final tickets from API with specific project IDs
  const fetchMyTickets = async () => {
    setIsLoadingFinalTab(true);
    try {
      let response;
      
      // Use search API if search query exists
      if (filters.search && filters.search.trim()) {
        response = await ticketsService.searchTickets(filters.search.trim());
      } else {
        response = await ticketsService.getTicketsForMe({
          page: 1,
          perPage: 50,
          projectId: '',
          search: filters.search || '',
          ticketTypeId: filters.ticketTypeId || '',
          ticketStatusId: filters.ticketStatusId || '',
          week: filters.weeks && filters.weeks.length > 0 ? filters.weeks : undefined,
          month: filters.month === 0 ? null : filters.month,
          sortBy: filters.sortBy || '',
          sortOrder: filters.sortOrder || '',
        });
      }

      if (response.success) {
        const items = response.data?.items || [];
        const transformedEntries: TicketEntry[] = Array.isArray(items) ? items.map((ticket: any) => ({
          id: ticket.id || Math.random().toString(36).substr(2, 9),
          ticketId: ticket.ticketId || ticket.code || ticket.id,
          projectName: ticket.projectName || 'Unknown Project',
          projectId: ticket.projectId || '',
          type: ticket.ticketTypeName || ticket.type || '',
          ticketTypeId: ticket.ticketTypeId || '',
          roles: Array.isArray(ticket.roleNames) ? ticket.roleNames : [],
          roleUuids: Array.isArray(ticket.roleUuids) ? ticket.roleUuids : [],
          status: ticket.ticketStatusName || ticket.status || '',
          ticketStatusId: ticket.ticketStatusId || '',
          timestamp: ticket.createdAt || ticket.created_at || new Date().toISOString().split('T')[0],
          week: ticket.week || 1,
          month: ticket.month || new Date().getMonth() + 1,
          length: 0
        })) : [];
        setFinalTabMyTickets(transformedEntries);
      } else {
        setFinalTabMyTickets([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch my tickets:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch your tickets');
      setFinalTabMyTickets([]);
    } finally {
      setIsLoadingFinalTab(false);
    }
  };

  // Fetch tickets when entering Final tab or when filters change
  useEffect(() => {
    if (activeTab !== 'final') return;
    fetchMyTickets();
  }, [activeTab, filters]);

  const [formData, setFormData] = useState({
    ticketId: '',
    type: DEFAULT_TYPE,
    roles: [] as string[]
  });

  // Toggle role selection
  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }));
    if (fieldErrors.roles) setFieldErrors({...fieldErrors, roles: false});
  };

  // Handle click outside role dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const errors: typeof fieldErrors = {};
    
    if (!formData.ticketId.trim()) {
      errors.ticketId = true;
      setValidationError('Please fill all required fields');
    }
    
    if (!selectedProjectId) {
      errors.project = true;
      setValidationError('Please fill all required fields');
    }
    
    if (formData.roles.length === 0) {
      errors.roles = true;
      setValidationError('Please fill all required fields');
    }
    
    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const ids = formData.ticketId
      .split(/[,;\s\n]+/)
      .map(s => s.trim())
      .filter(s => s);
    
    const ticketIdPattern = /^[a-zA-Z]+-\d+$/;
    const invalidIds = ids.filter(id => !ticketIdPattern.test(id));
    
    if (invalidIds.length > 0) {
      setValidationError(`Invalid ticket ID format: ${invalidIds.join(', ')}. Expected format: project id-numbers (e.g., ocd-01)`);
      setFieldErrors({ ticketId: true });
      return;
    }
    
    setValidationError('');
    setFieldErrors({});

    const resolvedTicketTypeId = getTicketTypeIdByName(formData.type);
    const resolvedDefaultStatusId = getTicketStatusIdByName(defaultDraftStatus);
    
    // Create one entry per ticket ID with all selected roles
    const newEntries: TicketEntry[] = ids.map(ticketId => {
      const selectedRoles = formData.roles.map((selectedValue) => {
        const role = findRoleBySelectedValue(selectedValue);
        return {
          roleName: role?.name || selectedValue,
          roleSubmitId: getRoleSubmitId(selectedValue),
        };
      });
      const selectedRoleNames = selectedRoles.map((role) => role.roleName);
      const selectedRoleUuids = selectedRoles.map((role) => role.roleSubmitId);
      
      const today = new Date();
      return {
        id: Math.random().toString(36).substr(2, 9),
        ticketId: ticketId,
        projectName: selectedProjectName || 'Unknown Project',
        projectId: selectedProjectId,
        type: formData.type,
        ticketTypeId: resolvedTicketTypeId,
        roles: selectedRoleNames,
        roleUuids: selectedRoleUuids,
        status: defaultDraftStatus,
        ticketStatusId: resolvedDefaultStatusId,
        timestamp: new Date().toISOString().split('T')[0],
        week: Math.ceil(today.getDate() / 7),
        weekLabel: '',
        month: today.getMonth() + 1,
        length: 0
      };
    });

    setDraftEntries(prev => [...prev, ...newEntries]);
    toast.success(`${newEntries.length} ticket${newEntries.length > 1 ? 's' : ''} added to draft!`);
    setFormData({ ...formData, ticketId: '', roles: [] });
  };

  const handleSubmitDraft = () => {
    if (draftEntries.length === 0) return;

    const employeeId = resolveEmployeeId();
    if (!employeeId) {
      toast.error('Cannot resolve valid employeeId from profile. Please re-login and try again.');
      return;
    }

    const normalizedTickets = draftEntries.map((entry) => {
      const cleanTicketId = entry.ticketId;
      const resolvedRoleIds = (entry.roleUuids && entry.roleUuids.length > 0
        ? entry.roleUuids
        : entry.roles
      )
        .map((roleValue) => getRoleSubmitId(roleValue))
        .filter(Boolean);
      
      let resolvedTicketTypeId = entry.ticketTypeId || getTicketTypeIdByName(entry.type);
      // If still not resolved, default to Bug type
      if (!resolvedTicketTypeId) {
        resolvedTicketTypeId = getDefaultBugTicketTypeId();
      }
      
      const resolvedTicketStatusId = entry.ticketStatusId || getTicketStatusIdByName(entry.status);
      const resolvedWeekNumber = entry.week || 1;
      const resolvedMonth = entry.month || new Date().getMonth() + 1;
      const resolvedWeekLabel =
        entry.weekLabel || weeks[resolvedWeekNumber - 1]?.name || String(resolvedWeekNumber);

      const normalizedEntry = {
        ticketId: cleanTicketId,
        ticketLink: buildTicketLink(cleanTicketId),
        projectId: resolveProjectId(entry),
        roleId: resolvedRoleIds,
        employeeId,
        ticketTypeId: resolvedTicketTypeId,
        ticketStatusId: resolvedTicketStatusId,
        week: resolvedWeekLabel,
        month: String(resolvedMonth),
      };

      // Debug log for this entry
      console.log('Normalized entry:', {
        ticketId: normalizedEntry.ticketId,
        projectId: normalizedEntry.projectId,
        roleId: normalizedEntry.roleId,
        roleIdLength: normalizedEntry.roleId?.length,
        ticketTypeId: normalizedEntry.ticketTypeId,
        ticketStatusId: normalizedEntry.ticketStatusId,
        originalRoles: entry.roles,
        originalRoleUuids: entry.roleUuids,
      });

      return normalizedEntry;
    });

    const invalidEntries = normalizedTickets.map((entry, index) => {
      const errors: string[] = [];
      if (!entry.projectId) errors.push('projectId');
      if (!entry.ticketTypeId) errors.push('ticketTypeId');
      if (!entry.ticketStatusId) errors.push('ticketStatusId');
      if (!entry.roleId || entry.roleId.length === 0) errors.push('roleId');
      
      return errors.length > 0 ? { ticketId: entry.ticketId, errors } : null;
    }).filter(Boolean);

    if (invalidEntries.length > 0) {
      console.error('Invalid entries:', invalidEntries);
      const firstError = invalidEntries[0];
      toast.error(`Some draft entries are missing required data (${invalidEntries.length}/${normalizedTickets.length}). Missing fields: ${firstError.errors.join(', ')}`);
      return;
    }

    const payload = {
      tickets: normalizedTickets,
    };

    submitTicketsBulk(payload)
      .then((response) => {
        const responseData = (response as any)?.data ?? response;
        const responseSuccess =
          typeof (response as any)?.success === 'boolean'
            ? (response as any).success
            : typeof responseData?.success === 'boolean'
              ? responseData.success
              : true;
        const responseMessage =
          (response as any)?.message ||
          responseData?.message ||
          '';

        // Check if response indicates failure (success: false)
        if (responseSuccess === false) {
          if (responseMessage.includes('already exist')) {
            const ticketIdMatch = responseMessage.match(/Ticket IDs?\s+(.+?)\s+already exists?/i);
            if (ticketIdMatch) {
              const ticketIds = ticketIdMatch[1].split(',').map(id => id.trim());

              // Find corresponding draft entries
              const existingEntries = draftEntries.filter(entry => {
                const cleanId = entry.ticketId.replace(/ \(\d+\)$/, '');
                return ticketIds.some(id => cleanId === id || entry.ticketId === id);
              });

              if (existingEntries.length > 0) {
                setAlreadyExistTickets(existingEntries.map(entry => ({
                  ticketId: entry.ticketId.replace(/ \(\d+\)$/, ''),
                  entry,
                })));
                setLastSubmittedPayload(payload);
                setShowAlreadyExistModal(true);
                return;
              }
            }
          }

          toast.error(responseMessage || 'Submit to final failed.');
          return;
        }

        const data = responseData?.data || responseData;
        
        // Show success message for created tickets
        if (data.total_created > 0) {
          toast.success(`${data.total_created} ticket${data.total_created > 1 ? 's' : ''} created successfully!`);
        }
        
        // If there are existing tickets, show modal
        if (data.existing && data.existing.length > 0) {
          setExistingTickets(data.existing);
          setLastSubmittedPayload(payload);
          setShowExistingModal(true);
        } else {
          // No existing tickets, clear draft and go to final tab
          setDraftEntries([]);
          setActiveTab('final');
          // Refetch tickets from API
          fetchMyTickets();
        }
      })
      .catch((error: any) => {
        const message = error?.response?.data?.message || 'Submit to final failed.';
        
        // Check if error is about existing tickets
        if (message.includes('already exist')) {
          // Extract ticket IDs from message like "Ticket IDs g-3 already exist" or "Ticket ID g-3 already exists"
          const ticketIdMatch = message.match(/Ticket IDs?\s+(.+?)\s+already exists?/i);
          if (ticketIdMatch) {
            const ticketIds = ticketIdMatch[1].split(',').map(id => id.trim());
            
            // Find corresponding draft entries
            const existingEntries = draftEntries.filter(entry => {
              const cleanId = entry.ticketId.replace(/ \(\d+\)$/, '');
              return ticketIds.some(id => cleanId === id || entry.ticketId === id);
            });
            
            if (existingEntries.length > 0) {
              setAlreadyExistTickets(existingEntries.map(entry => ({
                ticketId: entry.ticketId.replace(/ \(\d+\)$/, ''),
                entry,
              })));
              setLastSubmittedPayload(payload);
              setShowAlreadyExistModal(true);
              return;
            }
          }
        }
        
        toast.error(message);
      });
  };

  const updateStatus = (id: string, newStatus: string) => {
    setFinalEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, status: newStatus } : entry
    ));
  };

  const updateDraftType = (id: string, newType: string) => {
    const idsToUpdate = selectedDraftIds.has(id) ? selectedDraftIds : new Set([id]);
    setDraftEntries(prev => prev.map(entry => 
      idsToUpdate.has(entry.id)
        ? {
            ...entry,
            type: newType,
            ticketTypeId: getTicketTypeIdByName(newType),
          }
        : entry
    ));
  };

  const updateDraftStatus = (id: string, newStatus: string) => {
    const idsToUpdate = selectedDraftIds.has(id) ? selectedDraftIds : new Set([id]);
    setDraftEntries(prev => prev.map(entry => 
      idsToUpdate.has(entry.id)
        ? {
            ...entry,
            status: newStatus,
            ticketStatusId: getTicketStatusIdByName(newStatus),
          }
        : entry
    ));
  };

  const handleUpdateExistingTickets = async () => {
    setIsUpdatingExisting(true);
    
    try {
      // Update each existing ticket
      const updatePromises = existingTickets.map(async (item) => {
        const existingTicket = item.ticket;
        
        // Find corresponding payload item from lastSubmittedPayload
        const submittedTicket = lastSubmittedPayload?.tickets?.find(
          (t: any) => t.ticketId === item.ticketId
        );
        
        if (submittedTicket) {
          // Build update payload from submitted ticket data
          const updatePayload = {
            ticketId: existingTicket.ticketId,
            ticketLink: submittedTicket.ticketLink,
            projectId: submittedTicket.projectId,
            roleId: submittedTicket.roleId,
            employeeId: submittedTicket.employeeId,
            ticketTypeId: submittedTicket.ticketTypeId,
            ticketStatusId: submittedTicket.ticketStatusId,
            week: submittedTicket.week,
            month: submittedTicket.month,
          };
          
          return ticketsService.bulkUpdateTicket(existingTicket.id, updatePayload);
        }
      });
      
      await Promise.all(updatePromises);
      
      toast.success(`${existingTickets.length} existing ticket${existingTickets.length > 1 ? 's' : ''} updated successfully!`);
      
      // Clear and go to final tab
      setShowExistingModal(false);
      setExistingTickets([]);
      setLastSubmittedPayload(null);
      setDraftEntries([]);
      setActiveTab('final');
      // Refetch tickets from API
      fetchMyTickets();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update existing tickets.';
      toast.error(message);
    } finally {
      setIsUpdatingExisting(false);
    }
  };

  const handleSkipExistingTickets = () => {
    // Just close modal and go to final tab
    setShowExistingModal(false);
    setExistingTickets([]);
    setLastSubmittedPayload(null);
    setDraftEntries([]);
    setActiveTab('final');
    // Refetch tickets from API
    fetchMyTickets();
  };

  const handleUpdateAlreadyExistTickets = async () => {
    setIsUpdatingAlreadyExist(true);
    
    try {
      // Update each already-exist ticket
      const updatePromises = alreadyExistTickets.map(async (item) => {
        // Find corresponding payload item from lastSubmittedPayload
        const submittedTicket = lastSubmittedPayload?.tickets?.find(
          (t: any) => {
            const tId = t.ticketId.replace(/ \(\d+\)$/, '');
            return tId === item.ticketId;
          }
        );
        
        if (submittedTicket) {
          // Call PUT API for each existing ticket
          // Note: We need the ticket ID from backend, but we only have ticketId from Jira
          // We'll use the Jira ticket ID as the lookup
          return ticketsService.bulkUpdateTicket(item.ticketId, submittedTicket);
        }
      });
      
      await Promise.all(updatePromises);
      
      toast.success(`${alreadyExistTickets.length} existing ticket${alreadyExistTickets.length > 1 ? 's' : ''} updated successfully!`);
      
      // Clear and go to final tab
      setShowAlreadyExistModal(false);
      setAlreadyExistTickets([]);
      setLastSubmittedPayload(null);
      setDraftEntries([]);
      setActiveTab('final');
      // Refetch tickets from API
      fetchMyTickets();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update existing tickets.';
      toast.error(message);
    } finally {
      setIsUpdatingAlreadyExist(false);
    }
  };

  const handleCancelAlreadyExistTickets = () => {
    // Close modal and go to final tab
    setShowAlreadyExistModal(false);
    setAlreadyExistTickets([]);
    setLastSubmittedPayload(null);
    setDraftEntries([]);
    setActiveTab('final');
    // Refetch tickets from API
    fetchMyTickets();
  };

  const updateDraftWeek = (id: string, newWeek: number) => {
    const selectedWeekLabel = weeks[newWeek - 1]?.name || String(newWeek);
    const idsToUpdate = selectedDraftIds.has(id) ? selectedDraftIds : new Set([id]);
    setDraftEntries(prev => prev.map(entry => 
      idsToUpdate.has(entry.id)
        ? {
            ...entry,
            week: newWeek,
            weekLabel: selectedWeekLabel,
          }
        : entry
    ));
  };

  const updateDraftMonth = (id: string, newMonth: number) => {
    const idsToUpdate = selectedDraftIds.has(id) ? selectedDraftIds : new Set([id]);
    setDraftMonth(newMonth);
    setDraftEntries(prev => prev.map(entry => 
      idsToUpdate.has(entry.id)
        ? { ...entry, month: newMonth, week: undefined, weekLabel: '' }
        : entry
    ));
  };

  const removeRoleFromDraft = (entryId: string, roleToRemove: string) => {
    setDraftEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const removeIndex = entry.roles.findIndex(role => role === roleToRemove);
        const updatedRoles = entry.roles.filter((_, index) => index !== removeIndex);
        const updatedRoleUuids = (entry.roleUuids || []).filter((_, index) => index !== removeIndex);
        return { ...entry, roles: updatedRoles, roleUuids: updatedRoleUuids };
      }
      return entry;
    }));
  };

  const toggleDraftSelection = (id: string) => {
    setSelectedDraftIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllDraftSelection = () => {
    if (selectedDraftIds.size === draftEntries.length) {
      setSelectedDraftIds(new Set());
    } else {
      setSelectedDraftIds(new Set(draftEntries.map(e => e.id)));
    }
  };

  const calculateSplits = (length: number): number => {
    if (!length || length < 1) return 1;
    if (length <= 2) return 1;
    if (length <= 5) return 2;
    if (length <= 8) return 3;
    if (length <= 11) return 4;
    if (length <= 14) return 5;
    if (length <= 29) return 6;
    return 7; // 30+
  };

  const updateDraftLength = (id: string, newLength: number) => {
    const idsToUpdate = selectedDraftIds.has(id) ? selectedDraftIds : new Set([id]);
    
    // If multiple entries are selected, just update length without split logic
    if (idsToUpdate.size > 1) {
      setDraftEntries(prev => prev.map(entry =>
        idsToUpdate.has(entry.id)
          ? { ...entry, length: newLength }
          : entry
      ));
      return;
    }

    // Single entry - apply full split logic
    setDraftEntries(prev => {
      // Find the entry being updated
      const entryIndex = prev.findIndex(e => e.id === id);
      if (entryIndex === -1) return prev;
      
      const entry = prev[entryIndex];
      const oldLength = entry.length || 0;
      
      // Calculate old and new split counts
      const oldSplits = calculateSplits(oldLength);
      const newSplits = calculateSplits(newLength);
      const difference = newSplits - oldSplits;
      
      // If no difference, just update the length
      if (difference === 0) {
        const updated = [...prev];
        updated[entryIndex] = { ...entry, length: newLength };
        return updated;
      }
      
      // Get all entries with the same ticketId (without split number)
      const baseName = entry.ticketId.replace(/ \(\d+\)$/, ''); // Remove existing split number
      const sameTicketEntries = prev.filter(e => e.ticketId.replace(/ \(\d+\)$/, '') === baseName);
      
      const result = prev.filter(e => e.ticketId.replace(/ \(\d+\)$/, '') !== baseName);
      
      if (difference > 0) {
        // Need to add more tickets
        const updatedEntries = sameTicketEntries.map((e, idx) => ({
          ...e,
          ticketId: `${baseName} (${idx + 1})`,
          length: newLength
        }));
        
        for (let i = 0; i < difference; i++) {
          updatedEntries.push({
            ...entry,
            id: Math.random().toString(36).substr(2, 9),
            ticketId: `${baseName} (${updatedEntries.length + 1})`,
            length: newLength
          });
        }
        toast.success(`Added ${difference} ticket${difference > 1 ? 's' : ''}!`);
        return [...result, ...updatedEntries];
      } else {
        // Need to remove tickets (keep the first -difference entries)
        const updatedEntries = sameTicketEntries
          .slice(0, sameTicketEntries.length + difference)
          .map((e, idx) => ({
            ...e,
            ticketId: `${baseName} (${idx + 1})`,
            length: newLength
          }));
        toast.success(`Removed ${Math.abs(difference)} ticket${Math.abs(difference) > 1 ? 's' : ''}!`);
        return [...result, ...updatedEntries];
      }
    });
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Bug Fix':
      case 'Bug': return 'bg-red-100 text-red-700 border-red-200';
      case 'Task': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Feature': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Refactor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Hotfix': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Epic': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'Research': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-white text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Closed':
      case 'Reject':
      case 'Rejected': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'InQA': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      {/* Existing Tickets Modal */}
      <ExistingTicketsModal
        isOpen={showExistingModal}
        existingTickets={existingTickets}
        onUpdate={handleUpdateExistingTickets}
        onSkip={handleSkipExistingTickets}
        isUpdating={isUpdatingExisting}
      />

      {/* Already Exist Tickets Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
          showAlreadyExistModal ? 'bg-black/50 opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => !isUpdatingAlreadyExist && handleCancelAlreadyExistTickets()}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[24px]">warning</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                Tickets Already Exist
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                These tickets already exist in the system. Would you like to update them?
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            <div className="p-6 space-y-3">
              {alreadyExistTickets.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Ticket ID</p>
                      <p className="font-mono font-bold text-slate-900 mt-1">{item.ticketId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Project</p>
                      <p className="text-slate-700 mt-1">{item.entry.projectName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Type</p>
                      <p className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase ${getTypeColor(item.entry.type)}`}>
                        {item.entry.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Status</p>
                      <p className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase ${getStatusColor(item.entry.status)}`}>
                        {item.entry.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Roles</p>
                      <p className="text-slate-700 mt-1">{item.entry.roles.join(', ') || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Length (days)</p>
                      <p className="text-slate-700 mt-1">{item.entry.length || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            <button
              onClick={handleCancelAlreadyExistTickets}
              disabled={isUpdatingAlreadyExist}
              className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateAlreadyExistTickets}
              disabled={isUpdatingAlreadyExist}
              className="h-10 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {isUpdatingAlreadyExist ? (
                <>
                  <span className="inline-flex w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">update</span>
                  Update Tickets
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
              activeTab === 'draft'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Draft ({draftEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('final')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
              activeTab === 'final'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Final ({finalTabMyTickets.length})
          </button>
        </div>

        {activeTab === 'draft' && (
          <button
            type="button"
            onClick={handleSubmitDraft}
            disabled={draftEntries.length === 0 || isSubmittingFinal}
            className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold shadow-md transition-colors hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isSubmittingFinal ? 'Submitting...' : 'Submit to Final'}
          </button>
        )}
      </div>

      {activeTab === 'draft' && (
        <>
          <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-visible">
            <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[18px]">add_task</span>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Draft Ticket Entry</h3>
            </div>
            
            <form onSubmit={handleAddTicket} className="p-6 flex flex-col gap-4">
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-600">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {validationError}
                </div>
              )}
              
              <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">Ticket ID(s)</label>
                <input 
                  type="text" 
                  value={formData.ticketId}
                  onChange={(e) => {
                    setFormData({...formData, ticketId: e.target.value.toUpperCase()});
                    if (fieldErrors.ticketId) setFieldErrors({...fieldErrors, ticketId: false});
                  }}
                  placeholder="e.g. ODC-123, ODC-124"
                  className={`h-10 px-3 rounded-lg border bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all ${
                    fieldErrors.ticketId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-primary focus:border-primary'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">Project</label>
                <ProjectSelect
                  value={selectedProjectId}
                  onChange={(projectId, projectName) => {
                    setSelectedProjectId(projectId);
                    setSelectedProjectName(projectName || '');
                    if (fieldErrors.project) setFieldErrors({...fieldErrors, project: false});
                  }}
                  placeholder="Select a project..."
                  page={1}
                  perPage={10}
                  hasError={fieldErrors.project}
                />
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[200px]" ref={roleDropdownRef}>
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">Roles</label>
                <div className="relative">
                  {/* Select Box Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    disabled={isLoadingRoles || rolesData.length === 0}
                    className={`h-10 w-full px-3 rounded-lg border bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer transition-all disabled:bg-slate-100 disabled:text-slate-500 text-left flex items-center justify-between ${
                      fieldErrors.roles ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <span className="truncate">
                      {formData.roles.length === 0 
                        ? 'Select roles...' 
                        : formData.roles.length === 1 
                          ? findRoleBySelectedValue(formData.roles[0])?.name || 'Select roles...'
                          : `${formData.roles.length} roles selected`
                      }
                    </span>
                    <span className={`material-symbols-outlined text-slate-400 text-[16px] transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown List */}
                  {isRoleDropdownOpen && (
                    <div className="absolute top-12 left-0 right-0 bg-white border border-slate-300 rounded-lg shadow-2xl z-[9999] max-h-[200px] overflow-y-auto">
                      {isLoadingRoles ? (
                        <div className="p-3 text-sm text-slate-500">Loading roles...</div>
                      ) : rolesData.length === 0 ? (
                        <div className="p-3 text-sm text-red-500">No roles available</div>
                      ) : (
                        <div className="py-2">
                          {rolesData.map(role => (
                            <label key={role.roleUuid || role.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.roles.includes(role.roleUuid || role.id)}
                                onChange={() => toggleRole(role.roleUuid || role.id)}
                                className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer focus:ring-2 focus:ring-primary"
                              />
                              <span className="text-sm text-slate-900">{role.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add to Draft
              </button>
              </div>
            </form>
          </div>

          <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Draft Tickets</h3>
              <span className="text-xs font-semibold py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-full">
                {draftEntries.length} {draftEntries.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border-light">
                  <tr>
                    <th className="py-4 px-4 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedDraftIds.size === draftEntries.length && draftEntries.length > 0}
                        onChange={toggleAllDraftSelection}
                        className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer focus:ring-2 focus:ring-primary"
                      />
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Ticket ID</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">Project</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Type</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Role</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Status</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Week</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Month</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Length (days)</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {draftEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">inbox</span>
                          <p className="text-slate-500 font-medium">No draft tickets yet</p>
                          <p className="text-slate-400 text-sm">Add a ticket entry to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    draftEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDraftIds.has(entry.id)}
                            onChange={() => toggleDraftSelection(entry.id)}
                            className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="font-mono font-bold text-slate-900 text-sm">{entry.ticketId}</span>
                        </td>
                        <td className="py-4 px-6 text-left">
                          <span className="text-sm font-medium text-slate-700">{entry.projectName}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <select 
                              value={entry.type}
                              onChange={(e) => updateDraftType(entry.id, e.target.value)}
                              disabled={isLoadingTicketTypes && ticketTypes.length === 0}
                              className={`w-full h-8 pl-2 pr-7 rounded border text-xs font-semibold uppercase tracking-tight appearance-none outline-none cursor-pointer transition-all ${getTypeColor(entry.type)}`}
                            >
                              {draftTypeOptions.map((typeOption) => (
                                <option key={typeOption} value={typeOption}>{typeOption}</option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">expand_more</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-wrap gap-2 justify-center items-center">
                            {entry.roles.length === 0 ? (
                              <span className="text-xs text-slate-400">No roles</span>
                            ) : (
                              entry.roles.map((role, index) => (
                                <div key={index} className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-1 text-xs font-medium">
                                  <span>{role}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeRoleFromDraft(entry.id, role)}
                                    className="ml-1 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center"
                                    title="Remove role"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="relative inline-block w-full max-w-[120px]">
                            <select 
                              value={entry.status}
                              onChange={(e) => updateDraftStatus(entry.id, e.target.value)}
                              disabled={isLoadingTicketStatuses && ticketStatuses.length === 0}
                              className={`w-full h-8 pl-2 pr-7 rounded border text-xs font-semibold uppercase tracking-tight appearance-none outline-none cursor-pointer transition-all ${getStatusColor(entry.status)}`}
                            >
                              {draftStatusOptions.length === 0 && (
                                <option value="" disabled>No statuses</option>
                              )}
                              {draftStatusOptions.map((statusOption) => (
                                <option key={statusOption} value={statusOption}>{statusOption}</option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">expand_more</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="relative inline-block w-full max-w-[280px]">
                            <select 
                              value={entry.week || ''}
                              onChange={(e) => updateDraftWeek(entry.id, parseInt(e.target.value))}
                              disabled={!entry.month || weeks.length === 0}
                              className={`w-full h-8 pl-2 pr-7 rounded border text-xs font-semibold text-slate-700 appearance-none outline-none cursor-pointer transition-all ${
                                !entry.month || weeks.length === 0
                                  ? 'border-slate-200 bg-slate-100 text-slate-400 disabled:cursor-not-allowed'
                                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                              }`}
                            >
                              {!entry.month && <option value="">Select month first</option>}
                              {entry.month && weeks.length === 0 && <option value="">No weeks available</option>}
                              {weeks.map((week, idx) => (
                                <option key={week.id} value={idx + 1}>{week.name}</option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">expand_more</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="relative inline-block w-full max-w-[130px]">
                            <select 
                              value={entry.month || new Date().getMonth() + 1}
                              onChange={(e) => updateDraftMonth(entry.id, parseInt(e.target.value))}
                              className="w-full h-8 pl-2 pr-7 rounded border border-slate-300 bg-slate-50 text-xs text-slate-700 appearance-none outline-none cursor-pointer transition-all hover:bg-slate-100"
                            >
                              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>
                                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">expand_more</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <input 
                            type="number" 
                            value={entry.length || 0}
                            onChange={(e) => updateDraftLength(entry.id, parseFloat(e.target.value) || 0)}
                            placeholder="1"
                            min="1"
                            step="0.5"
                            className="w-16 h-7 px-2 rounded border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button 
                            onClick={() => {
                              setDraftEntries(prev => prev.filter(e => e.id !== entry.id));
                              toast.success('Draft ticket deleted!');
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete ticket"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'final' && (
        <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Final Tickets</h3>
              {isLoadingFinalTab && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="inline-flex w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Loading...
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Filters
              </button>
              <span className="text-xs font-semibold py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-full">
                {finalTabMyTickets.length} {finalTabMyTickets.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

          </div>

          <FilterDialog
            isOpen={isFilterOpen}
            filters={filters}
            onFilterChange={setFilters}
            onReset={() => {
              setFilters({
                search: '',
                ticketTypeId: '',
                ticketStatusId: '',
                sortBy: '',
                sortOrder: '',
                weeks: [],
                month: 0,
              });
            }}
          />
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-border-light">
                <tr>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Ticket ID</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">Project</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">Employee</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Type</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Status</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Roles</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Week</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {finalTabMyTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">inbox</span>
                        <p className="text-slate-500 font-medium">No final tickets yet</p>
                        <p className="text-slate-400 text-sm">You have no assigned tickets</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  finalTabMyTickets.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6 text-center">
                          <span className="font-mono font-bold text-slate-900 text-sm">{entry.ticketId}</span>
                        </td>
                        <td className="py-4 px-6 text-left">
                          <span className="text-sm font-medium text-slate-700">{entry.projectName}</span>
                        </td>
                        <td className="py-4 px-6 text-left">
                          <span className="text-sm text-slate-600">{entry.roles?.length > 0 ? entry.roles[0] : '-'}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-wrap gap-1 justify-center items-center">
                            {entry.roles && entry.roles.length === 0 ? (
                              <span className="text-xs text-slate-400">No roles</span>
                            ) : (
                              entry.roles?.map((role, index) => (
                                <span key={index} className="inline-flex px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                                  {role}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-xs font-semibold text-slate-700">{entry.week || '-'}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-xs text-slate-700">
                            {entry.month ? new Date(2000, entry.month - 1).toLocaleString('default', { month: 'long' }) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogTickets;
