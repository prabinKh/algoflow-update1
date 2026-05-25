import { useState, useEffect } from "react";

import { repairService } from "@/api/repairService";
import { 
  Wrench, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Trash2,
  Mail,
  User,
  Smartphone,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  GripVertical
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { safeToDate } from "@/lib/utils";
import { motion, AnimatePresence, Reorder } from "motion/react";

interface RepairTicket {
  id: string;
  ticketId: string;
  category: string;
  brand: string;
  model: string;
  serialNumber?: string;
  component: string;
  description: string;
  serviceType: string;
  address?: string;
  currentLocation?: string;
  whatsappNumber?: string;
  contactChannel: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: string;
  createdAt: string | null;
}

const ServiceTickets = () => {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  const statuses = ["Received", "Diagnosing", "In Repair", "Completed", "Cancelled"];

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const ticketsData = await repairService.getAll();
        setTickets(ticketsData as RepairTicket[]);
      } catch (error) {
        toast.error("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await repairService.updateStatus(id, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const deleteTicket = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await repairService.delete(id);
      toast.success("Ticket deleted successfully");
    } catch (error) {
      toast.error("Failed to delete ticket");
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      (ticket.ticketId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.model || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Received": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Diagnosing": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "In Repair": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelled": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-accent text-foreground border-border";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="text-emerald-500" />
            Repair Service Tickets
          </h1>
          <p className="text-sm text-muted-foreground">Manage and track all customer repair requests</p>
        </div>
        <div className="flex bg-accent p-1 rounded-xl">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === "table" ? "bg-card text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon size={16} />
            Table
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === "kanban" ? "bg-card text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid size={16} />
            Kanban
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by ID, Customer, Brand..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <select
            className="flex-1 bg-card border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Diagnosing">Diagnosing</option>
            <option value="In Repair">In Repair</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "table" ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ticket ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Device</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading tickets...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <AlertCircle size={48} strokeWidth={1} />
                        <p>No repair tickets found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-emerald-600">{ticket.ticketId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xs">
                            {(ticket.userName || "U").charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">{ticket.userName || "Unknown Customer"}</span>
                            <span className="text-xs text-muted-foreground">{ticket.userEmail || "No Email"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{ticket.brand} {ticket.model}</span>
                          <span className="text-xs text-muted-foreground">{ticket.category} - {ticket.component}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-sm text-muted-foreground">
                          {(() => {
                            const date = safeToDate(ticket.createdAt);
                            return date ? format(date, "MMM dd, yyyy") : "N/A";
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <div className="relative group/menu">
                            <button className="p-2 hover:bg-accent text-muted-foreground rounded-lg transition-colors">
                              <MoreVertical size={18} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                              <button onClick={() => updateStatus(ticket.id, "Diagnosing")} className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center gap-2">
                                <Clock size={14} /> Mark Diagnosing
                              </button>
                              <button onClick={() => updateStatus(ticket.id, "In Repair")} className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center gap-2">
                                <Wrench size={14} /> Mark In Repair
                              </button>
                              <button onClick={() => updateStatus(ticket.id, "Completed")} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                <CheckCircle size={14} /> Mark Completed
                              </button>
                              <div className="h-px bg-accent my-1" />
                              <button onClick={() => deleteTicket(ticket.id)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                <Trash2 size={14} /> Delete Ticket
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px] no-scrollbar">
          {statuses.map((status) => (
            <div 
              key={status} 
              className="flex-shrink-0 w-80 flex flex-col gap-4"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-emerald-50/50');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-emerald-50/50');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-emerald-50/50');
                if (draggedTicketId) {
                  updateStatus(draggedTicketId, status);
                  setDraggedTicketId(null);
                }
              }}
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status === "Received" ? "bg-blue-500" :
                    status === "Diagnosing" ? "bg-yellow-500" :
                    status === "In Repair" ? "bg-orange-500" :
                    status === "Completed" ? "bg-emerald-500" :
                    "bg-rose-500"
                  }`} />
                  <h3 className="font-bold text-foreground">{status}</h3>
                  <span className="bg-accent text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {filteredTickets.filter(t => t.status === status).length}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 p-2 rounded-2xl transition-colors min-h-[100px]">
                {filteredTickets
                  .filter(t => t.status === status)
                  .map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      layoutId={ticket.id}
                      draggable
                      onDragStart={() => setDraggedTicketId(ticket.id)}
                      onDragEnd={() => setDraggedTicketId(null)}
                      className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[10px] font-bold text-emerald-600">{ticket.ticketId}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Eye size={14} />
                          </button>
                          <GripVertical size={14} className="text-muted-foreground/50" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-foreground">{ticket.brand} {ticket.model}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{ticket.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                            {(ticket.userName || "U").charAt(0)}
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[100px]">
                            {ticket.userName || "Guest"}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {(() => {
                            const date = safeToDate(ticket.createdAt);
                            return date ? format(date, "MMM dd") : "";
                          })()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                
                {filteredTickets.filter(t => t.status === status).length === 0 && (
                  <div className="flex-1 border-2 border-dashed border-border rounded-2xl flex items-center justify-center p-8 text-muted-foreground/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Wrench size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Ticket Details</h2>
                    <p className="text-sm font-mono text-emerald-600 font-bold">{selectedTicket.ticketId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-card rounded-xl text-muted-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User size={14} /> Customer Information
                  </h3>
                  <div className="bg-muted rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Name</span>
                      <span className="text-sm font-bold text-foreground">{selectedTicket.userName || "Unknown Customer"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Email</span>
                      <span className="text-sm font-medium text-foreground">{selectedTicket.userEmail || "No Email"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Contact Channel</span>
                      <span className="text-sm font-bold text-emerald-600 uppercase">{selectedTicket.contactChannel}</span>
                    </div>
                    {selectedTicket.whatsappNumber && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">WhatsApp Number</span>
                        <span className="text-sm font-bold text-foreground">{selectedTicket.whatsappNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Smartphone size={14} /> Device Information
                  </h3>
                  <div className="bg-muted rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Device</span>
                      <span className="text-sm font-bold text-foreground">{selectedTicket.brand} {selectedTicket.model}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Category / Component</span>
                      <span className="text-sm font-medium text-foreground">{selectedTicket.category} - {selectedTicket.component}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Serial Number</span>
                      <span className="text-sm font-mono text-foreground">{selectedTicket.serialNumber || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <AlertCircle size={14} /> Service Details
                  </h3>
                  <div className="bg-muted rounded-2xl p-4 space-y-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Problem Description</span>
                      <p className="text-sm text-foreground mt-1 leading-relaxed">{selectedTicket.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Service Type</span>
                        <span className="text-sm font-bold text-foreground capitalize">{selectedTicket.serviceType}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Date Submitted</span>
                        <span className="text-sm font-medium text-foreground">
                          {(() => {
                            const date = safeToDate(selectedTicket.createdAt);
                            return date ? format(date, "MMMM dd, yyyy HH:mm") : "N/A";
                          })()}
                        </span>
                      </div>
                    </div>
                    {selectedTicket.address && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Service Address</span>
                        <span className="text-sm text-foreground">{selectedTicket.address}</span>
                      </div>
                    )}
                    {selectedTicket.currentLocation && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Current Location</span>
                        <span className="text-sm text-foreground font-medium">{selectedTicket.currentLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      updateStatus(selectedTicket.id, "Completed");
                      setSelectedTicket(null);
                    }}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Complete Repair
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default ServiceTickets;
