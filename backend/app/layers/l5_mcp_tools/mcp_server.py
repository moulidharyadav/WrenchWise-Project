"""
Layer 5: MCP Protocol Server (Model Context Protocol).
Adheres to JSON-RPC 2.0 MCP specification with strict separation between
protocol handling and underlying banking business logic.
"""
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from app.layers.l5_mcp_tools.tool_registry import MCPToolRegistry

class MCPProtocolHandler:
    """
    Protocol handler converting incoming JSON-RPC 2.0 requests into MCP responses.
    Delegates all tool discovery and tool execution to MCPToolRegistry.
    """
    SERVER_NAME = "horizon-banking-mcp-server"
    SERVER_VERSION = "2.4.0"
    PROTOCOL_VERSION = "2024-11-05"

    @classmethod
    def handle_jsonrpc_request(cls, request: Dict[str, Any], caller_agent: str = "SUPERVISOR") -> Dict[str, Any]:
        """
        Processes standard MCP JSON-RPC 2.0 requests:
        - initialize
        - tools/list
        - tools/call
        - resources/list
        - resources/read
        - ping
        """
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        # JSON-RPC 2.0 validation
        if request.get("jsonrpc") != "2.0" or not method:
            return cls._error_response(req_id, -32600, "Invalid Request: Must specify jsonrpc: '2.0' and 'method'.")

        try:
            if method == "initialize":
                return cls._handle_initialize(req_id, params)
            elif method == "ping":
                return cls._success_response(req_id, {})
            elif method == "tools/list":
                return cls._handle_tools_list(req_id, params)
            elif method == "tools/call":
                return cls._handle_tools_call(req_id, params, caller_agent)
            elif method == "resources/list":
                return cls._handle_resources_list(req_id, params)
            elif method == "resources/read":
                return cls._handle_resources_read(req_id, params)
            else:
                return cls._error_response(req_id, -32601, f"Method not found: '{method}' is not supported by MCP server.")
        except Exception as e:
            return cls._error_response(req_id, -32603, f"Internal MCP Error: {str(e)}")

    @classmethod
    def _handle_initialize(cls, req_id: Any, params: Dict[str, Any]) -> Dict[str, Any]:
        return cls._success_response(req_id, {
            "protocolVersion": cls.PROTOCOL_VERSION,
            "capabilities": {
                "tools": {"listChanged": False},
                "resources": {"subscribe": False, "listChanged": False},
                "logging": {}
            },
            "serverInfo": {
                "name": cls.SERVER_NAME,
                "version": cls.SERVER_VERSION
            }
        })

    @classmethod
    def _handle_tools_list(cls, req_id: Any, params: Dict[str, Any]) -> Dict[str, Any]:
        tools = MCPToolRegistry.get_available_tools()
        mcp_tools = []
        for t in tools:
            mcp_tools.append({
                "name": t["name"],
                "description": t["description"],
                "inputSchema": t.get("input_schema", {"type": "object"}),
                "_metadata": {
                    "category": t.get("category"),
                    "authorized_agents": t.get("authorized_agents"),
                    "permission": t.get("permission"),
                    "is_sensitive": t.get("is_sensitive", False)
                }
            })
        return cls._success_response(req_id, {"tools": mcp_tools})

    @classmethod
    def _handle_tools_call(cls, req_id: Any, params: Dict[str, Any], caller_agent: str) -> Dict[str, Any]:
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        if not tool_name:
            return cls._error_response(req_id, -32602, "Invalid params: 'name' is required for tools/call.")

        ok, result = MCPToolRegistry.execute_tool(tool_name, arguments, invoking_agent=caller_agent)

        content = [
            {
                "type": "text",
                "text": json.dumps(result, indent=2)
            }
        ]

        return cls._success_response(req_id, {
            "content": content,
            "isError": not ok,
            "_audit": {
                "invoking_agent": caller_agent,
                "timestamp": datetime.utcnow().isoformat()
            }
        })

    @classmethod
    def _handle_resources_list(cls, req_id: Any, params: Dict[str, Any]) -> Dict[str, Any]:
        resources = [
            {
                "uri": "banking://system/status",
                "name": "Banking System Health & Layer Telemetry",
                "mimeType": "application/json"
            },
            {
                "uri": "banking://policies/aml_sanctions",
                "name": "FATF & AML Statutory Policies",
                "mimeType": "text/markdown"
            },
            {
                "uri": "banking://models/benchmarks",
                "name": "Federal Reserve & Treasury Benchmark Curves",
                "mimeType": "application/json"
            }
        ]
        return cls._success_response(req_id, {"resources": resources})

    @classmethod
    def _handle_resources_read(cls, req_id: Any, params: Dict[str, Any]) -> Dict[str, Any]:
        uri = params.get("uri")
        if uri == "banking://system/status":
            contents = [{"uri": uri, "mimeType": "application/json", "text": json.dumps({"status": "ONLINE", "layers_active": 9})}]
        elif uri == "banking://policies/aml_sanctions":
            contents = [{"uri": uri, "mimeType": "text/markdown", "text": "# AML Policy\nMandatory CTR at $10k+, SAR between $9k-$9,999."}]
        elif uri == "banking://models/benchmarks":
            contents = [{"uri": uri, "mimeType": "application/json", "text": json.dumps({"sofr": "5.32%", "10y_treasury": "4.28%"})}]
        else:
            return cls._error_response(req_id, -32602, f"Resource not found: '{uri}'")

        return cls._success_response(req_id, {"contents": contents})

    @classmethod
    def _success_response(cls, req_id: Any, result: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": result
        }

    @classmethod
    def _error_response(cls, req_id: Any, code: int, message: str) -> Dict[str, Any]:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": code,
                "message": message
            }
        }
