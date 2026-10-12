from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.layers.l5_mcp_tools.mcp_server import MCPProtocolHandler
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

router = APIRouter(tags=["Layer 5: Tool & MCP Gateway"])

class DirectToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    invoking_agent: str = Field(default="SUPERVISOR")

@router.post("/mcp/rpc")
async def mcp_jsonrpc_endpoint(payload: Dict[str, Any] = Body(...)):
    """
    Standard MCP (Model Context Protocol) JSON-RPC 2.0 endpoint.
    Supports: initialize, tools/list, tools/call, resources/list, resources/read.
    """
    return MCPProtocolHandler.handle_jsonrpc_request(payload)

@router.get("/mcp/tools")
async def get_mcp_tools_catalog():
    """
    Returns full catalog of all 12 registered banking tools with schemas and permissions.
    """
    return {
        "total_tools": len(MCPToolRegistry.get_available_tools()),
        "tools": MCPToolRegistry.get_available_tools()
    }

@router.post("/mcp/tools/execute")
async def execute_tool_directly(req: DirectToolExecuteRequest):
    """
    Executes tool with authorization enforcement, sandboxing, and audit logging.
    """
    ok, result = MCPToolRegistry.execute_tool(
        tool_name=req.tool_name,
        arguments=req.arguments,
        invoking_agent=req.invoking_agent
    )
    return {
        "tool_name": req.tool_name,
        "invoking_agent": req.invoking_agent,
        "success": ok,
        "result": result
    }

@router.get("/mcp/audit-log")
async def get_mcp_tool_audit_log(limit: int = Query(default=50, ge=1, le=200)):
    """
    Returns immutable audit log of recent tool executions.
    """
    return {
        "log_entries": MCPToolRegistry.get_tool_audit_log(limit=limit)
    }
