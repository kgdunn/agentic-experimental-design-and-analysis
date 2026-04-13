"""Design generation and evaluation endpoints."""

from fastapi import APIRouter

from app.schemas.designs import GenerateDesignRequest, GenerateDesignResponse
from app.services.doe_service import call_tool

router = APIRouter()


@router.post("/generate", response_model=GenerateDesignResponse)
async def generate_design(request: GenerateDesignRequest):
    """Generate an experimental design matrix.

    Supports full factorial, fractional factorial, Plackett-Burman,
    Box-Behnken, CCD, DSD, optimal, mixture, and Taguchi designs.
    """
    result = await call_tool("generate_design", request.to_tool_input())
    return GenerateDesignResponse(**result)
