import React, { useState, useEffect } from "react";
import { AgGridReact, AgGridColumn } from "@ag-grid-community/react";
import { ServerSideRowModelModule } from "@ag-grid-enterprise/server-side-row-model";
import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
import "@ag-grid-community/core/dist/styles/ag-grid.css";
import "@ag-grid-community/core/dist/styles/ag-theme-alpine-dark.css";
import "./styles.css";

export default function App() {
  const [columnNameFilter, setColumnNameFilter] = useState("");
  const [gridApi, setGridApi] = useState(null);

  const onGridReady = (params) => {
    setGridApi(params.api);

    const httpRequest = new XMLHttpRequest();
    const updateData = (data) => {
      var fakeServer = createFakeServer(data);
      var datasource = createServerSideDatasource(fakeServer);
      params.api.setServerSideDatasource(datasource);
    };
    httpRequest.open(
      "GET",
      "https://raw.githubusercontent.com/ag-grid/ag-grid/master/grid-packages/ag-grid-docs/src/olympicWinners.json"
    );
    httpRequest.send();
    httpRequest.onreadystatechange = () => {
      if (httpRequest.readyState === 4 && httpRequest.status === 200) {
        updateData(JSON.parse(httpRequest.responseText));
      }
    };
  };

  useEffect(() => {
    if (gridApi) {
      if (Boolean(columnNameFilter)) {
        const columns = gridApi.columnController.gridColumns || [];

        const filteredColumns = columns.filter(Boolean).filter((column) => {
          return column.colDef.headerName
            ?.toLowerCase()
            ?.includes(columnNameFilter.toLowerCase());
        });

        // Add the class to the first element that we find
        const focusedColumn = filteredColumns[0];

        if (focusedColumn) {
          // Scroll to the focused column
          gridApi.ensureColumnVisible(focusedColumn);

          // Add highlight class
          gridApi.setColumnDefs(
            gridApi.columnController.columnDefs.map((column) => {
              return {
                ...column,
                headerClass:
                  focusedColumn.colDef.headerName === column.headerName
                    ? "highlight"
                    : null
              };
            })
          );

          gridApi.refreshHeader();
        }
      } else {
        gridApi.setColumnDefs(
          gridApi.columnController.columnDefs.map((column) => {
            return {
              ...column,
              headerClass: null
            };
          })
        );
      }
    }
  }, [columnNameFilter, gridApi]);

  console.log("Column defs", gridApi && gridApi.columnController.columnDefs);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div
        style={{
          height: "100%",
          width: "100%"
        }}
        className="ag-theme-alpine-dark"
      >
        <>
          <input
            placeholder="Column search..."
            value={columnNameFilter}
            onChange={(event) => setColumnNameFilter(event.target.value)}
          />
          <AgGridReact
            modules={[ServerSideRowModelModule, ColumnsToolPanelModule]}
            defaultColDef={{
              flex: 1,
              minWidth: 100
            }}
            rowModelType={"serverSide"}
            onGridReady={onGridReady}
          >
            <AgGridColumn field="athlete" headerName="Athlete" minWidth={220} />
            <AgGridColumn field="country" headerName="Country" minWidth={200} />
            <AgGridColumn field="year" headerName="Year" />
            <AgGridColumn field="sport" headerName="Sport" minWidth={200} />
            <AgGridColumn field="gold" headerName="Gold" />
            <AgGridColumn field="silver" headerName="Silver" />
            <AgGridColumn field="bronze" headerName="Bronze" />
            <AgGridColumn field="total" headerName="Total" />
          </AgGridReact>
        </>
      </div>
    </div>
  );

  function createServerSideDatasource(server) {
    return {
      getRows: function (params) {
        var response = server.getData(params.request);
        setTimeout(function () {
          if (response.success) {
            params.successCallback(response.rows, response.lastRow);
          } else {
            params.failCallback();
          }
        }, 500);
      }
    };
  }
  function createFakeServer(allData) {
    return {
      getData: function (request) {
        var requestedRows = allData.slice(request.startRow, request.endRow);
        var lastRow = getLastRowIndex(request, requestedRows);
        return {
          success: true,
          rows: requestedRows,
          lastRow: lastRow
        };
      }
    };
  }

  function getLastRowIndex(request, results) {
    if (!results) return undefined;
    var currentLastRow = request.startRow + results.length;
    return currentLastRow < request.endRow ? currentLastRow : undefined;
  }
}
