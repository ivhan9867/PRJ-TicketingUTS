/* tiket.c - pendamping tugas Struktur Data: struct, array, pointer, linked list, sorting, searching.
   Kompilasi: gcc -Wall tiket.c -o tiket && ./tiket */
#include <stdio.h>
#include <string.h>

typedef struct {                       /* STRUCT */
    int id; char tipe[12], lingkup[14], nama[40], asal[20], tujuan[20];
    long harga; int durasi; float rating;
} Tiket;

static Tiket tiket[] = {               /* ARRAY of struct */
    {0,"pesawat","nasional","Garuda Indonesia GA-312","Jakarta","Surabaya",1450000,95,4.7f},
    {1,"pesawat","nasional","Citilink QG-826","Jakarta","Surabaya",780000,100,4.2f},
    {2,"pesawat","internasional","Scoot TR-281","Denpasar","Singapura",1600000,175,4.2f},
    {3,"kereta","nasional","Argo Bromo Anggrek","Jakarta","Surabaya",650000,540,4.6f},
    {4,"kereta","nasional","Whoosh","Jakarta","Bandung",250000,45,4.8f},
    {5,"bus","nasional","Sinar Jaya","Jakarta","Bandung",120000,180,4.2f},
    {6,"kapal","internasional","Batam Fast","Batam","Singapura",420000,60,4.5f},
    {7,"hotel","nasional","Hotel Majapahit","Surabaya","",1650000,0,4.8f},
    {8,"hotel","internasional","Marina Bay Sands","Singapura","",6400000,0,4.8f},
    {9,"hiburan","nasional","Dunia Fantasi","Jakarta","",270000,0,4.4f},
};
#define N ((int)(sizeof tiket / sizeof tiket[0]))

typedef struct Node {                  /* LINKED LIST pesanan */
    char kode[12]; Tiket *t; struct Node *next;   /* next = pointer ke node berikutnya */
} Node;

static void tampil_array(void) {
    puts("== ARRAY + POINTER ==");
    for (Tiket *p = tiket; p < tiket + N; p++)             /* aritmetika pointer */
        printf("p=%p  offset=+%-4ld  %-24s Rp%ld\n", (void *)p, (long)((char *)p - (char *)tiket), p->nama, p->harga);
}

static void bubble_sort(Tiket *a[], int n) {               /* mengurutkan array POINTER, struct tidak dipindah */
    int cmp = 0, swp = 0;
    puts("\n== BUBBLE SORT (harga naik) ==");
    for (int i = 0; i < n - 1; i++) {
        int tukar = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            cmp++;
            if (a[j + 1]->harga < a[j]->harga) {
                Tiket *tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp; swp++; tukar = 1;
                printf("Pass %d: tukar %s <-> %s\n", i + 1, a[j + 1]->nama, a[j]->nama);
            }
        }
        if (!tukar) { puts("Tidak ada pertukaran, berhenti lebih awal."); break; }
    }
    printf("%d perbandingan, %d pertukaran\n", cmp, swp);
}

static void linear_search(Tiket *a[], int n, const char *kata) {
    int ketemu = 0;
    printf("\n== LINEAR SEARCH \"%s\" ==\n", kata);
    for (int i = 0; i < n; i++) {
        int ok = strstr(a[i]->nama, kata) || strstr(a[i]->asal, kata) || strstr(a[i]->tujuan, kata);
        printf("[%d] %-24s -> %s\n", i, a[i]->nama, ok ? "cocok" : "tidak");
        ketemu += ok;
    }
    printf("%d ditemukan\n", ketemu);
}

static int binary_search_harga(Tiket *a[], int n, long target) {   /* a harus terurut naik */
    int lo = 0, hi = n, langkah = 0;
    printf("\n== BINARY SEARCH harga >= %ld ==\n", target);
    while (lo < hi) {
        int mid = (lo + hi) / 2; langkah++;
        printf("Langkah %d: lo=%d hi=%d mid=%d harga=%ld -> %s\n", langkah, lo, hi, mid, a[mid]->harga, a[mid]->harga >= target ? "kiri" : "kanan");
        if (a[mid]->harga >= target) hi = mid; else lo = mid + 1;
    }
    printf("Batas bawah di indeks %d (%d tiket)\n", lo, n - lo);
    return lo;
}

static void push(Node **head, Node *baru) { baru->next = *head; *head = baru; }   /* sisip di depan, O(1) */

static void hapus(Node **head, const char *kode) {         /* pointer ke pointer: tidak perlu kasus khusus head */
    for (Node **pp = head; *pp; pp = &(*pp)->next)
        if (strcmp((*pp)->kode, kode) == 0) { *pp = (*pp)->next; printf("Node %s dilepas\n", kode); return; }
}

static void cetak(const Node *head) {
    printf("head");
    for (const Node *c = head; c; c = c->next) printf(" -> [%s %s]", c->kode, c->t->nama);
    puts(" -> NULL");
}

int main(void) {
    Tiket *view[N];
    for (int i = 0; i < N; i++) view[i] = &tiket[i];       /* tiap elemen menunjuk struct aslinya */
    tampil_array();
    bubble_sort(view, N);
    linear_search(view, N, "Jakarta");
    binary_search_harga(view, N, 1000000);

    puts("\n== LINKED LIST PESANAN ==");
    Node a = {"PSN-AAA", &tiket[0], NULL}, b = {"PSN-BBB", &tiket[4], NULL}, c = {"PSN-CCC", &tiket[7], NULL};
    Node *head = NULL;
    push(&head, &a); push(&head, &b); push(&head, &c); cetak(head);
    hapus(&head, "PSN-BBB"); cetak(head);
    return 0;
}
