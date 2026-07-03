<?php

namespace App\Exports;

use App\Models\Election;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ResultsExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Election $election;

    public function __construct(Election $election)
    {
        $this->election = $election;
    }

    public function collection()
    {
        return $this->election->results()
            ->with('candidate')
            ->orderBy('rank')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Rang',
            'Candidat',
            'Nombre de votes',
            'Pourcentage',
            'Score final',
        ];
    }

    public function map($result): array
    {
        return [
            $result->rank,
            $result->candidate->full_name,
            $result->total_votes,
            round($result->percentage, 2).'%',
            round($result->final_score, 2),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
