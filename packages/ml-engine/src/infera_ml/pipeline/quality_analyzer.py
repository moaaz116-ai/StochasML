from .base import PipelineStage, PipelineContext
from dataclasses import dataclass
from enum import Enum
import numpy as np

class Severity(str, Enum):
    PASS = "pass"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class QualityCheckResult:
    name: str
    status: Severity
    message: str
    details: dict

class QualityAnalyzer(PipelineStage):
    def execute(self, context: PipelineContext) -> PipelineContext:
        data = context.data
        labels = context.labels
        
        results = []
        
        # 1. Missing Values Check
        nans = np.isnan(data).sum()
        if nans > 0:
            results.append(QualityCheckResult(
                name="Missing Values", 
                status=Severity.CRITICAL, 
                message=f"Found {nans} missing values.", 
                details={'nan_count': int(nans)}
            ))
        else:
            results.append(QualityCheckResult(
                name="Missing Values", 
                status=Severity.PASS, 
                message="No missing values found.", 
                details={'nan_count': 0}
            ))

        # 2. Class Imbalance Check
        unique, counts = np.unique(labels, return_counts=True)
        max_count = np.max(counts)
        min_count = np.min(counts)
        ratio = max_count / min_count if min_count > 0 else float('inf')
        
        if ratio > 5:
            severity = Severity.CRITICAL
            msg = f"Severe class imbalance detected. Ratio is {ratio:.2f}:1."
        elif ratio > 3:
            severity = Severity.WARNING
            msg = f"Moderate class imbalance detected. Ratio is {ratio:.2f}:1."
        else:
            severity = Severity.PASS
            msg = f"Classes are relatively balanced. Ratio is {ratio:.2f}:1."
            
        results.append(QualityCheckResult(
            name="Class Balance",
            status=severity,
            message=msg,
            details={'ratio': float(ratio), 'class_counts': {str(k): int(v) for k, v in zip(unique, counts)}}
        ))
        
        # 3. Dataset Size
        min_samples_per_class = min_count
        if min_samples_per_class < 5:
            results.append(QualityCheckResult(
                name="Dataset Size",
                status=Severity.CRITICAL,
                message=f"Too few samples for some classes (min {min_samples_per_class}). Need at least 5.",
                details={'min_samples': int(min_samples_per_class)}
            ))
        elif min_samples_per_class < 20:
            results.append(QualityCheckResult(
                name="Dataset Size",
                status=Severity.WARNING,
                message=f"Low number of samples for some classes (min {min_samples_per_class}). Recommend at least 20.",
                details={'min_samples': int(min_samples_per_class)}
            ))
        else:
            results.append(QualityCheckResult(
                name="Dataset Size",
                status=Severity.PASS,
                message="Adequate number of samples per class.",
                details={'min_samples': int(min_samples_per_class)}
            ))

        # Determine overall report status
        overall = Severity.PASS
        for res in results:
            if res.status == Severity.CRITICAL:
                overall = Severity.CRITICAL
                break
            elif res.status == Severity.WARNING:
                overall = Severity.WARNING

        context.metadata['quality_report'] = {
            'overall_status': overall,
            'checks': [
                {'name': r.name, 'status': r.status, 'message': r.message, 'details': r.details}
                for r in results
            ]
        }
        
        return context
